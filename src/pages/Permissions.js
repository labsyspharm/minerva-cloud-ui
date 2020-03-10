import React from 'react';
import RepositorySelect from '../components/RepositorySelect';
import UserGroupSelect from '../components/UserGroupSelect';
import Client from '../MinervaClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus } from '@fortawesome/free-solid-svg-icons'
import '../css/Permissions.css';

class Permissions extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            grants: [],
            users: [],
            repository: null,
            selectedUser: null
        }

        this.repositorySelected = this.repositorySelected.bind(this);
        this.userOrGroupSelected = this.userOrGroupSelected.bind(this);

        if (this.props.repositoryUuid) {
            Client.getRepository(this.props.repositoryUuid).then(response => {
                this.repositorySelected(response.data);
            });
        }
    }

    repositorySelected(repository) {
        this.refreshGrants(repository);
    }

    userOrGroupSelected(userOrGroup, type) {
        if (!userOrGroup) {
            this.setState({selectedUser: null});
            return;
        }
        if (this.state.selectedUser && this.state.selectedUser.uuid === userOrGroup.uuid) {
            this.setState({selectedUser: null});
            return;
        }
        if (!this.state.repository) {
            console.warn('Repository not selected');
            return;
        }
        this.setState({selectedUser: userOrGroup});
    }

    addGrant(permission) {
        Client.grantPermissionToRepository(this.state.selectedUser.uuid, this.state.repository.uuid, permission).then(response => {
            console.log('Permission granted');
            this.refreshGrants(this.state.repository);
        }).catch(err => {
            console.error(err);
        });
    }

    refreshGrants(repository) {
        Client.listGrantsForRepository(repository.uuid).then(response => {
            console.log(response);
            this.setState({grants: response.data, users: response.included.users, repository: repository, groups: response.included.groups})
        });
    }

    getUsername(uuid) {
        for (let user of this.state.users) {
            if (user.uuid === uuid) {
                return user.name;
            }
        }
        for (let group of this.state.groups) {
            if (group.uuid === uuid) {
                return group.name;
            }
        }
        return 'unnamed';
    }

    removeGrant(grant) {
        console.log('Remove grant ', grant);
        Client.deleteGrant(grant.repository_uuid, grant.subject_uuid).then(response => {
            console.log('Removed grant');
            this.refreshGrants(this.state.repository);
        }).catch(err => {
            console.error(err);
        })
    }

    render() {
        return (
            <div className="container mt-3">
            <div className="row">
                <div className="col col-3 mr-3">
                <RepositorySelect onSelect={this.repositorySelected} />
                <UserGroupSelect onSelect={this.userOrGroupSelected}/>
                {this.renderAddUser()}
                </div>
                <div className="col col-6">
                    {this.renderGrants()}
                </div>
            </div>
            </div>
        );
    }

    renderAddUser() {
        if (!this.state.selectedUser) {
            return null;
        }
        return (
            <div>
                <div className="list-group">
                    <a href="#" className="list-group-item list-group-item-action text-dark userGroupItem" onClick={() => this.addGrant('Admin')}>
                        <span className="badge badge-primary">Admin</span>
                        <div>User/group is able to import, read and delete images.</div>
                    </a>
                    <a href="#" className="list-group-item list-group-item-action text-dark userGroupItem" onClick={() => this.addGrant('Read')}>
                        <span className="badge badge-secondary">Read</span>
                        <div>User/group is only able to read images.</div>
                    </a>
                </div>
            </div>
        )
    }

    renderGrants() {
        if (!this.state.repository) {
            return null;
        }
        return (
            <div>
                <h2 className="h4">Permissions to "{this.state.repository.name}"</h2>
            
            <ul className="list-group">
                {this.state.grants.map((grant, key) => {
                    let badgeClass = 'badge badge-pill';
                    if (grant.permission == 'Admin') {
                        badgeClass += ' badge-primary';
                    } else if (grant.permission == 'Read') {
                        badgeClass += ' badge-secondary';
                    }
                    return (
                        <li className="list-group-item text-dark" key={key}>
                            {this.getUsername(grant.subject_uuid)} <span className={badgeClass}>{grant.permission}</span>
                            &nbsp;
                            <button type="button" className="btn btn-danger btn-sm float-right" onClick={() => this.removeGrant(grant)}>
                                <FontAwesomeIcon icon={faMinus} />
                            </button>
                        </li>
                    )
                })}
            </ul>
            </div>
        );
    }
}

export default Permissions;