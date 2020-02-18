import AppConfig from './AppConfig';

class MinervaClient {

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.accessToken = null;
        this.currentUser = null;
    }

    setToken(token) {
        this.accessToken = token;
    }

    setUser(user) {
        this.currentUser = user;
    }

    loggedIn() {
        return this.accessToken != null;
    }

    getRepositories() {
        return this.apiFetch('GET', '/repository');
    }

    getImports(repositoryUuid) {
        return this.apiFetch('GET', '/repository/' + repositoryUuid + '/imports');
    }

    createRepository(data) {
        return this.apiFetch('POST', '/repository', {data: data});
    }

    deleteRepository(uuid) {
        return this.apiFetch('DELETE', '/repository/' + uuid);
    }

    createImport(data) {
        return this.apiFetch('POST', '/import', {data: data});
    }

    updateImport(uuid, data) {
        return this.apiFetch('PUT', '/import/' + uuid, {data: data});
    }

    getImportCredentials(uuid) {
        return this.apiFetch('GET', '/import/' + uuid + '/credentials');
    }

    listFilesetsInImport(uuid) {
        return this.apiFetch('GET', '/import/' + uuid + '/filesets');
    }

    listImportsInRepository(uuid) {
        return this.apiFetch('GET', '/repository/' + uuid + '/imports');
    }

    listImagesInFileset(uuid) {
        return this.apiFetch('GET', '/fileset/' + uuid + '/images');
    }

    listIncompleteImports() {
        return this.apiFetch('GET', '/import/incomplete');
    }

    getCognitoDetails() {
        return this.apiFetch('GET', '/cognito_details');
    }

    getImageTile(uuid, level, x, y, z=0, t=0) {
        let channelPathParams = '0,0000FF,0,1';
        return this.apiFetch(
            'GET',
            '/image/' + uuid + '/render-tile/' + x + '/' + y + '/' + z + '/' + t
            + '/' + level + '/' + channelPathParams, {binary: true, headers: {"Accept": "image/jpeg"} });

    }

    getImageDimensions(uuid) {
        return this.apiFetch('GET', '/image/' + uuid + '/dimensions');
    }

    apiFetch(method, route, config={}) {
        let params = config.params;
        let body = config.body;
        let binary = config.binary;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.accessToken
        };
        let headers = {...defaultHeaders, ...config.headers};

        let url = this.baseUrl + route;

        if (params) {
            const queryParams = Object.keys(params)
                .map(key => key + '=' + params[key])
                .join('&');
            if (queryParams.length > 0) {
                url += '?' + queryParams;
            }
        }

        const args = {
            method,
            headers,
            mode: 'cors',
            cache: 'no-cache'
        };

        if (body !== null) {
            args['body'] = JSON.stringify(body)
        }

        return fetch(url, args)
            .then(response => {
                if (response.status === 401) {
                    // Access token has expired, refresh token
                    // FIXME Refreshing should ideally be done before token expires
                    this.currentUser.getSession((err, session) => {
                        this.setToken(session.idToken.jwtToken);
                    });
                }
                // Turn HTTP error responses into rejected promises
                if (!response.ok) {
                    return response.text()
                    .then(text => {
                        return Promise.reject('Error ' + response.status + ' ('
                                            + response.statusText + '): ' + text);
                    });
                }

            if (response.status === 204) {
                return '';
            }
            else if (!binary) {    
                return response.json();
            } else {
                return response.blob();
            }
        });
    }

}

var Client = new MinervaClient(AppConfig.minervaBaseUrl + '/' + AppConfig.minervaStage);

export default Client;