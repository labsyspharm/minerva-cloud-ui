import React, { Component } from 'react';
import Client from '../MinervaClient';
import TreeNode from './TreeNode';
import '../css/Tree.css';

class RepositoryTree extends Component {

    constructor(props) {
        super(props);

        this.loadChildren = this.loadChildren.bind(this);
        this.closeNode = this.closeNode.bind(this);

        this.state = {
            rootNode: {
                root: true,
                children: [],
                level: 1
            }
        }

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
            let rootNode = {
                root: true,
                children: repositories,
                level: 1
            }
            this.setState({ rootNode: rootNode });
        });
    }

    loadChildren(node, onFinished) {
        console.log('load children ', node);
        if (node.leaf) {
            return;
        }
        let loadFunction = null;
        if (node.type === 'repository') {
            loadFunction = this.loadFilesets;
        } else if (node.type === 'fileset') {
            loadFunction = this.loadImages;
        }
        if (!loadFunction) {
            console.warn('Invalid node type ', node.type);
            return;
        }
        loadFunction(node).then(res => {
            
            node.children = [];
            node.children = node.children.concat(res);
            node.expanded = true;
            onFinished();
            console.log(node.children);
            this.forceUpdate();
        });
    }

    loadFilesets(node) {
        return new Promise((resolve, reject) => {
            Client.listImportsInRepository(node.uuid).then(response => {
                let filesets = [];
                let promises = [];
                for (let imp of response.data) {
                    let id = 0;
                    let loadFilesets = Client.listFilesetsInImport(imp.uuid);
                    promises.push(loadFilesets);
                    loadFilesets.then(response => {
                        for (let fileset of response.data) {
                            id++;
                            filesets.push({
                                type: 'fileset',
                                uuid: fileset.uuid,
                                id: id,
                                title: fileset.name,
                                children: [],
                                level: node.level + 1,
                                color: 'info'
                            });
                        }
                    });
                }
                Promise.all(promises).then(() => {
                    resolve(filesets);
                });
            });
        });
    }

    loadImages(node) {
        return new Promise((resolve, reject) => {
            Client.listImagesInFileset(node.uuid).then(response => {
                let images = [];
                let id = 0;
                for (let image of response.data) {
                    id++;
                    images.push({
                        type: 'image',
                        id: id,
                        title: image.name,
                        uuid: image.uuid,
                        leaf: true,
                        level: node.level + 1,
                        color: 'secondary'
                    });
                }
                resolve(images);
            });
        });
    }

    closeNode(node) {
        node.expanded = false;
        node.children = [];
        this.forceUpdate();
    }

    render() {
        return (
            <div className="treeRoot">
                <TreeNode node={this.state.rootNode} onExpand={this.loadChildren} onClose={this.closeNode}></TreeNode>
            </div>
        );
    }

}

export default RepositoryTree;