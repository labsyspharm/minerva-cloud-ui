import React from 'react';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import Client from '../MinervaClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import '../css/ChannelGroups.css';

class ChannelGroups extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: 0,
            modal: false,
            channelGroupsJson: ''
        };

        this.showModal = this.showModal.bind(this);
        this.addChannelGroup = this.addChannelGroup.bind(this);
    }

    select(item, index) {
        this.setState({selected: index});
        this.props.onChannelGroupSelected(item.uuid);
    }

    addChannelGroup() {
        let obj = this.parseAndValidateJson(this.state.channelGroupsJson);
        if (!obj) {
            return;
        }
        Client.createRenderingSettings(this.props.node.uuid, obj).then(response => {
            alertify.success('Created new channel group');
        }).catch(err => {
            if (err.status == 403) {
                alertify.error('You don\'t have sufficient permissions to add new channel groups to this image.');
            } else {
                alertify.error(err.message);
            }
            console.error(err);
        });
    }

    showModal() {
        this.setState({channelGroupsJson: ''});
    }

    render() {
        if (!this.props.groups) {
            return null;
        }
        return (
            <div className="btn-group-toggle" data-toggle="buttons">
                { this.renderModal() }
                <h5 className="h5">CHANNEL GROUPS
                    &nbsp;
                    { !this.props.guest ?
                        <button type="button" className="btn btn-success" onClick={this.showModal} data-toggle="modal" data-target="#addChannelGroupModal">
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    : null }
                </h5>
                {this.props.groups.map((item, index) => {
                    let clazz = "btn btn-secondary btn-sm btn-block";
                    if (this.state.selected === index) {
                        clazz += " active";
                    }
                    return (
                        <label className={clazz} key={index}>
                            <input type="checkbox" onClick={() => this.select(item, index)}/>{item.label}
                        </label>
                        );
                    })}
                    
            </div>
        );
    }

    renderModal() {
        return (
            <div id="addChannelGroupModal" className="modal" tabIndex="-1" role="dialog" aria-labelledby="addChannelGroupModal" aria-hidden="true">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title text-dark">Add Channel Group</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body text-dark">
                    <p>Paste channel groups below in json format.</p>
                    <code>
                        <textarea className="form-control jsonTextarea" value={this.state.channelGroupsJson}
                            onChange={(e) => this.handleJsonChange(e)}></textarea>
                    </code>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => this.showExample()}>Show example</button>
                    <button type="button" className="btn btn-primary" onClick={this.addChannelGroup} data-dismiss="modal">Save changes</button>
                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
                </div>
            </div>
            </div>
        );
    }

    showExample() {
        let example = {
            "groups": [
                {
                    "label": "Group_Label",
                    "channels": [
                        {
                            "id": 0,
                            "label": "Channel_Label",
                            "color": "ff0000",
                            "min": 0.1,
                            "max": 0.9
                        }
                    ]
                }
            ]
        }
        this.setState({channelGroupsJson: JSON.stringify(example, null, 2)});
    }

    handleJsonChange(evt) {
        this.setState({channelGroupsJson: evt.target.value});
    }

    parseAndValidateJson() {
        let obj = null;
        let groups = null;
        try {
            obj = JSON.parse(this.state.channelGroupsJson);
            groups = obj.groups;
        }
        catch (e) {
            alertify.error('Invalid JSON ', e);
            return null;
        }
        if (!groups) {
            alertify.error('JSON is missing property "groups"');
            return null;
        }
        for (let group of groups) {
            for (let channel of group.channels) {
                if (!channel.id && channel.id !== 0) {
                    alertify.error('Channel is missing property "id"');
                    return null;
                }
                if (!channel.color) {
                    alertify.error('Channel is missing property "color"');
                    return null;
                }
                if (!channel.min && channel.min !== 0) {
                    alertify.error('Channel is missing property "min"');
                    return null;
                }
                if (!channel.max && channel.max !== 0) {
                    alertify.error('Channel is missing property "max"');
                    return null;
                }
                if (!channel.label) {
                    alertify.error('Channel is missing property "label"');
                    return null;
                }
            }
        }
        return obj;
    }

}

export default ChannelGroups;