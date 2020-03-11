import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faDatabase, faImage } from '@fortawesome/free-solid-svg-icons'
import ContextMenu from './ContextMenu';
import Spinner from './Spinner';

class TreeNode extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            loading: false
        }
        this.ref = React.createRef();

        this.onLoadFinished = this.onLoadFinished.bind(this);
        this.onDeleted = this.onDeleted.bind(this);
    }

    render() {
        if (this.props.node == null) {
            return null;
        }
        if (this.props.node.root) {
            return (
                <span>
                    {this.loop(this.props.node.children)}
                </span>
            )
        }
        let liClass = 'list-group-flush list-group-item treeNode treeNodeLevel' + this.props.node.level;
        if (this.props.node.leaf) {
            liClass += ' treeNodeLeaf list-group-flush';
        }
        if (this.props.node.deleted) {
            liClass += ' treeNodeDeleted';
        }
        let badgeClass = 'badge badge-pill';
        if (this.props.node.color) {
            badgeClass += ' badge-' + this.props.node.color;
        }
        let nodeType = this.props.node.type.charAt(0).toUpperCase();
        return (
            <li ref={this.ref} className={liClass} onClick={(evt) => this.onClick(this.props.node, evt)} onContextMenu={(evt) => this.openContextMenu(this.props.node, evt)}>
                {this.renderIcon()}&nbsp;
                {this.props.node.title}
                &nbsp;
                <Spinner show={this.state.loading} />
    
                {this.loop(this.props.node.children)}
            </li>
        );
    }

    renderIcon() {
        if (this.props.node.type == 'repository') {
            return (
                <FontAwesomeIcon icon={faDatabase}></FontAwesomeIcon>
            )
        } else {
            return (
                <FontAwesomeIcon icon={faImage}></FontAwesomeIcon>
            )
        }
    }

    renderContextMenu() {
        if (this.state.contextMenu !== this.props.node) {
            return null;
        }
        return (
            <ContextMenu node={this.props.node} onDeleted={this.onDeleted} onClosed={this.onContextMenuClosed} />
        );
    }

    onDeleted(node) {
        node.deleted = true;
        this.props.onClose(node);
    }

    openContextMenu(node, e) {
        e.preventDefault();
        e.stopPropagation();
        this.props.onOpenContextMenu(node, e);
    }

    onClick(node, e) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        if (this.props.node.leaf) {
            this.props.onSelect(node);
        }
        else if (this.props.node.expanded) {
            this.props.onClose(node);
        } else if (!this.props.node.leaf) {
            this.setState({ loading: true });
            this.props.onExpand(node, this.onLoadFinished);
        }
    }

    onLoadFinished() {
        this.setState({ loading: false });
    }

    loop(children) {
        if (!children || children.length === 0) {
            return null;
        }
        return (
            <ul className="list-group-flush list-group">
                {children.map((item, index) => (
                    <TreeNode key={index} node={item} 
                        onClick={this.props.onNodeClicked} 
                        onExpand={this.props.onExpand} 
                        onClose={this.props.onClose} 
                        onSelect={this.props.onSelect} 
                        onOpenContextMenu={this.props.onOpenContextMenu}/>
                ))}
            </ul>
        );
    }
}

export default TreeNode;