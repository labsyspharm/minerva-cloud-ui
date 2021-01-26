import React from 'react';
import Client from '../MinervaClient';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import { navigate } from "@reach/router";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faFolderOpen, faUserCog, faTrashRestore, faBookOpen } from '@fortawesome/free-solid-svg-icons'

class ContextMenu extends React.Component {

    constructor(props) {
        super(props);

        this.close = this.close.bind(this);
    }

    render() {
        if (!this.props.node) {
            return null;
        }
        let containerStyle = {
            position: 'fixed',
            left: this.props.left,
            top: this.props.top,
            cursor: 'pointer'
        };
        let className = 'dropdown-menu dropdown-menu-sm show';
        return (
            <div style={containerStyle} onContextMenu={(evt) => this.close(evt)}>
                <div className={className} id="context-menu">
                    {this.renderItems(this.props.node.type)}
                </div>
            </div>
        )
    }

    renderItems(nodeType) {
        if (nodeType === 'repository') {
            return (
                <span>
                <a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'permissions')}>
                    <FontAwesomeIcon className="mr-2" icon={faUserCog}/>
                    Manage Repository
                </a>
                </span>
            )
        } else if (nodeType === 'fileset') {
            return (
                <a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'delete')}>Delete</a>
            )
        }
        else if (nodeType ==='image') {
            return (
                <span>
                {this.renderDeletedOrRestore()}
                {this.renderOpenAuthor()}
                </span>
            )
        }
    }

    renderDeletedOrRestore() {
        if (!this.props.node.deleted) {
            return (<a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'delete')}>
                <FontAwesomeIcon className="mr-2" icon={faTrash}/>
                Delete
                </a>);
        } else {
            return (<a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'restore')}>
                <FontAwesomeIcon className="mr-2" icon={faTrashRestore}/>
                Restore
            </a>);
        }
    }

    renderOpenAuthor() {
        return (<a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'author')}>
        <FontAwesomeIcon className="mr-2" icon={faBookOpen}/>
        Open in Author
        </a>);
    }

    onClick(evt, command) {
        evt.preventDefault();
        evt.stopPropagation();

        if (command === 'delete') {
            this.delete(this.props.node);
        } else if (command === 'restore') {
            this.restore(this.props.node);
            alertify.warning('Not implemented yet');
        } else if (command === 'open') {
            alertify.warning('Not implemented yet');
        } else if (command === 'permissions') {
            navigate(`/permissions/${this.props.node.uuid}`);
        } else if (command === 'author') {
            window.open(`https://author.minerva.im?image=${this.props.node.uuid}`);
        }
        this.props.onClosed();
    }
 
    delete(node) {
        let title = this.props.node.title;
        alertify.confirm('Confirmation', 'Are you sure you wish to delete "' + title + '" ?',
            () => {
                if (node.type === 'image') {
                    Client.deleteImage(node.uuid).then(() => {
                        this.props.onDeleted(node);
                    }).catch(err => {
                        alertify.error(err.message);
                    });
                }
            },
            () => {});
    }

    restore(node) {
        // TODO make a request to backend
        this.props.onRestored(node);
    }

    close(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.props.onClosed();
    }

}
export default ContextMenu;