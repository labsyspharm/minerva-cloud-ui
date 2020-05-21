import React, { Component } from 'react';
import Client from '../MinervaClient';
import TreeNode from './TreeNode';
import '../css/Tree.css';
import ContextMenu from './ContextMenu';
import Spinner from './Spinner';

class RepositoryTree extends Component {

    constructor(props) {
        super(props);

        this.loadChildren = this.loadChildren.bind(this);
        this.closeNode = this.closeNode.bind(this);
        this.select = this.select.bind(this);
        this.openContextMenu = this.openContextMenu.bind(this);
        this.onContextMenuClosed = this.onContextMenuClosed.bind(this);
        this.onDeleted = this.onDeleted.bind(this);
        this.onRestored = this.onRestored.bind(this);

        this.state = {
            rootNode: null,
            selected: null,
            context: null,
            contextClass: '',
            loading: true
        }
    }

    componentDidMount() {
        this.refreshRepositories(); 
    }

    refreshRepositories() {
        if (!Client.loggedIn()) {
            this.setState({rootNode: null});
            return;
        }
        Client.getRepositories().then(repos => {
            let repositories = [];
            for (let repo of repos.included.repositories) {
                repositories.push({
                    type: 'repository',
                    uuid: repo.uuid,
                    key: repo.uuid,
                    title: repo.name,
                    data: repo,
                    isLeaf: false,
                    description: 'Repository',
                    level: 1,
                    expanded: false,
                    color: 'primary'
                });
            }
            let rootNode = {
                root: true,
                children: repositories,
                level: 1
            }
            this.setState({ rootNode: rootNode, loading: false });
        }).catch(err => {
            console.error(err);
            this.setState({ loading: false });
        });
    }

    loadChildren(node, onFinished) {
        if (node.leaf) {
            return;
        }
        let loadFunction = null;
        if (node.type === 'repository') {
            loadFunction = this.loadImagesInRepository;
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
            this.forceUpdate();
        }).catch(err => {
            console.error(err);
            onFinished();
        });
    }

    loadImagesInRepository(node) {
        return new Promise((resolve, reject) => {
            Client.listImagesInRepository(node.uuid).then(response => {
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
                        color: 'secondary',
                        data: image,
                        deleted: image.deleted
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

    select(node) {
        this.setState({selected: node});
        this.props.onSelect(node);
    }

    onContextMenuClosed() {
        this.setState({context: null});
    }

    onDeleted(node) {
        node.deleted = true;
        this.forceUpdate();
    }

    onRestored(node) {
        node.deleted = false;
        this.forceUpdate();
    }

    openContextMenu(node, e) {
        this.setState({context: node, contextLeft: e.pageX, contextTop: e.pageY});
    }

    render() {
        
        return (
            <div>
                <h5 className="h5 text-left">REPOSITORIES <Spinner show={this.state.loading} /></h5>
                <div className="treeRoot">
                    <TreeNode node={this.state.rootNode} onExpand={this.loadChildren} onClose={this.closeNode} onSelect={this.select} onOpenContextMenu={this.openContextMenu}></TreeNode>
                    <ContextMenu className={this.state.contextClass} node={this.state.context} onDeleted={this.onDeleted} onRestored={this.onRestored} onClosed={this.onContextMenuClosed} left={this.state.contextLeft} top={this.state.contextTop}/>
                </div>
            </div>
        );
    }

}

export default RepositoryTree;