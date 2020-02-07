import React from 'react';
import Client from './../MinervaClient';
import RepositoryTree from './../components/RepositoryTree';

class Repositories extends React.Component {
    constructor(props) {
        super(props);
        this.state = {  
            repositories: [],
            nodes: []
        };
        this.refreshRepositories();
    }

    refreshRepositories() {
        if (!Client.loggedIn()) {
            return;
        }
        Client.getRepositories().then(repos => {
            console.log(repos);
            let repositories = [];
            let id = 0;
            for (let repo of repos.included.repositories) {
                id++;
                console.log(repo);
                repositories.push({
                    type: 'repository',
                    uuid: repo.uuid,
                    key: repo.uuid,
                    title: repo.name,
                    isLeaf: false,
                    description: 'Repository',
                    level: 1,
                    expanded: false,
                    color: 'primary'
                });
            }
            console.log(repos);
            this.setState({ nodes: repositories });
        });
    }
        
    render() {
        return (
            <div className="container">
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Repositories</h1>
                </div>
                <RepositoryTree />
            </div>
            
        );
      }
}

export default Repositories;