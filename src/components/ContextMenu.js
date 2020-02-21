import React from 'react';
import Client from '../MinervaClient';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';

class ContextMenu extends React.Component {

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
        console.log(containerStyle);
        let className = 'dropdown-menu dropdown-menu-sm show';
        return (
            <div style={containerStyle}>
                <div class={className} id="context-menu">
                    {this.renderItems(this.props.node.type)}
                </div>
            </div>
        )
    }

    renderItems(nodeType) {
        if (nodeType == 'repository') {
            return (
                <span>
                <a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'permissions')}>Manage Permissions</a>
                <a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'delete')}>Delete</a>
                </span>
            )
        } else if (nodeType == 'fileset') {
            return (
                <a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'delete')}>Delete</a>
            )
        }
        else if (nodeType == 'image') {
            return (
                <span>
                <a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'open')}>Open in Minerva Story</a>
                <a className="dropdown-item" onClick={(evt) => this.onClick(evt, 'permissions')}>Manage Permissions</a>
                </span>
            )
        }
    }

    onClick(evt, command) {
        evt.preventDefault();
        evt.stopPropagation();

        if (command === 'delete') {
            this.delete(this.props.node);
        } else if (command === 'open') {
            alertify.warning('Not implemented yet');
        } else if (command === 'permissions') {
            alertify.warning('Not implemented yet');
        }
        this.props.onClosed();
    }
 
    delete(node) {
        let title = this.props.node.title;
        alertify.confirm('Confirmation', 'Are you sure you wish to delete "' + title + '" ?',
            () => {
                if (node.type === 'repository') {
                    Client.deleteRepository(node.uuid).then(() => {
                        this.props.onDeleted(node);
                    });
                }
            },
            () => {});
    }

    close() {
        this.props.onClosed();
    }

}
export default ContextMenu;