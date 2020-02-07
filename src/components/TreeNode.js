import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

class TreeNode extends React.Component {
        
    constructor(props) {
        super(props);

        this.state = {
            loading: false
        }

        this.onLoadFinished = this.onLoadFinished.bind(this);
    }

    render() {
        if (this.props.node.root) {
            return (
                <span>
                    {this.loop(this.props.node.children)}
                </span>
            )
        }
        let liClass = 'list-group-flush list-group-item treeNode ' + 'treeNodeLevel' + this.props.node.level;
        if (this.props.node.leaf) {
            liClass += ' treeNodeLeaf list-group-flush';
        }
        let badgeClass = 'badge badge-pill';
        if (this.props.node.color) {
            badgeClass += ' badge-' + this.props.node.color;
        }
        return (
            <li className={liClass} onClick={(evt) => this.onClick(this.props.node, evt)}>
               {this.props.node.title}&nbsp;  
               <span className={badgeClass}>{this.props.node.type}</span>
               &nbsp;
               {this.state.loading ? <FontAwesomeIcon icon={faSpinner} spin></FontAwesomeIcon> : null }
               {this.loop(this.props.node.children)}
            </li>
        );
      }

    onClick(node, e) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        if (this.props.node.expanded) {
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
        if (!children || children.length == 0) {
            return null;
        }
        return (
            <ul className="list-group-flush list-group">
            {children.map((item, index) => (
              <TreeNode key={index} node={item} onClick={this.props.onNodeClicked} onExpand={this.props.onExpand} onClose={this.props.onClose}/>
            ))}
          </ul>
        );
    }
}

export default TreeNode;