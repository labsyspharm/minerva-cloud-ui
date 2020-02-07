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
        return this.apiFetch('POST', '/repository', null, data);
    }

    createImport(data) {
        return this.apiFetch('POST', '/import', null, data);
    }

    updateImport(uuid, data) {
        return this.apiFetch('PUT', '/import/' + uuid, null, data);
    }

    getImportCredentials(uuid) {
        return this.apiFetch('GET', '/import/' + uuid + '/credentials', null, null);
    }

    listFilesetsInImport(uuid) {
        return this.apiFetch('GET', '/import/' + uuid + '/filesets', null, null);
    }

    listImportsInRepository(uuid) {
        return this.apiFetch('GET', '/repository/' + uuid + '/imports', null, null);
    }

    listImagesInFileset(uuid) {
        return this.apiFetch('GET', '/fileset/' + uuid + '/images', null, null);
    }

    listIncompleteImports() {
        return this.apiFetch('GET', '/import/incomplete', null, null);
    }

    apiFetch(method, route, params=null, body=null) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.accessToken
        };

        let url = this.baseUrl + route;

        if (params !== null) {
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

            return response.json();
        });
      }

}

var Client = new MinervaClient(AppConfig.minervaBaseUrl + '/' + AppConfig.minervaStage);

export default Client;