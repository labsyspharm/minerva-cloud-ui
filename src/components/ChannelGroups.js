import React from 'react';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import Client from '../MinervaClient';
import Spinner from './Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagic } from '@fortawesome/free-solid-svg-icons'
import '../css/ChannelGroups.css';
import {Button, Dropdown} from "react-bootstrap";

class ChannelGroups extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: 0,
            modal: false,
            channelGroupsJson: '',
            autoSettingsSpinner: false,
            threshold: 0.0002
        };

        this.showModal = this.showModal.bind(this);
        this.addChannelGroup = this.addChannelGroup.bind(this);
        this.autoSettings = this.autoSettings.bind(this);
    }

    select(item, index) {
        this.setState({selected: index});
        this.props.onChannelGroupSelected(item);
    }

    addChannelGroup() {
        let obj = this.parseAndValidateJson(this.state.channelGroupsJson);
        if (!obj) {
            return;
        }
        alertify.success('Saving channel group');
        Client.createRenderingSettings(this.props.node.uuid, obj).then(response => {
            alertify.success('Created new channel group');
            this.props.onChannelGroupSelected(response.groups[0]);
        }).catch(err => {
            if (err.status === 403) {
                alertify.error('You don\'t have sufficient permissions to add new channel groups to this image.');
            } else {
                alertify.error(err.message);
            }
            console.error(err);
        });
    }

    autoSettings() {
        let channelsArray = this.props.channels.map(c => c.id);
        Client.getAutoSettings(this.props.image.uuid, channelsArray, this.state.threshold).then(res => {
            this.setState({autoSettingsSpinner: false});
            this.props.onAutoSettings(res);
        }).catch(err => {
            console.error(err);
            this.setState({autoSettingsSpinner: false});
        });
        this.setState({autoSettingsSpinner: true});
    }

    showModal() {
        let group = {
                "label": this.props.selectedItem.label,
                "channels": this.props.channels
            }
        if (
          this.props.selectedItem.uuid
          && this.props.selectedItem.uuid !== '00000000-0000-0000-0000-000000000000'
        ) {
            group.uuid = this.props.selectedItem.uuid;
        }
        let groups = {
            "groups": [ group ]
        }
        this.setState({
            channelGroupsJson: JSON.stringify(groups, null, 2)
        });
    }

    render() {
        if (!this.props.groups) {
            return null;
        }
        let dropdownLabel = 'Select group';
        if (this.props.selectedItem) {
            dropdownLabel = this.props.selectedItem.label;
        }
        return (
            <div
              className="btn-group-toggle"
              data-toggle="buttons"
            >
                { this.renderModal() }
                <h5 className="h5">
                    CHANNEL GROUPS
                    &nbsp;
                    { !this.props.guest &&
                        <Button
                          onClick={this.showModal}
                          data-toggle="modal"
                          data-target="#addChannelGroupModal"
                        >
                            Save
                        </Button>
                    }
                </h5>
                <Dropdown>
                    <Dropdown.Toggle
                      variant="secondary"
                      id="dropdownMenuButton"
                    >
                        { dropdownLabel }
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {this.props.groups.map((item, index) => {
                        return (
                            <Dropdown.Item
                              key={index}
                              href="#"
                              onClick={() => this.select(item, index)}
                            >
                                {item.label}
                            </Dropdown.Item>
                            );
                        })}
                    </Dropdown.Menu>
                    {' '}
                    <Button
                      variant="secondary"
                      onClick={this.autoSettings}
                      disabled={this.state.autoSettingsSpinner}
                    >
                        { this.state.autoSettingsSpinner ? 
                            <Spinner show={this.state.autoSettingsSpinner} />
                            :
                            <FontAwesomeIcon icon={faMagic} />
                        }
                        &nbsp;Auto
                    </Button>
                </Dropdown>
            </div>
        );
    }

    renderModal() {
        return (
            <div
              id="addChannelGroupModal"
              className="modal"
              tabIndex="-1"
              role="dialog"
              aria-labelledby="addChannelGroupModal"
              aria-hidden="true"
            >
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
                                <textarea
                                  className="form-control jsonTextarea"
                                  value={this.state.channelGroupsJson}
                                  onChange={(e) => this.handleJsonChange(e)}
                                />
                            </code>
                        </div>
                        <div className="modal-footer">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={this.addChannelGroup}
                              data-dismiss="modal"
                            >
                                Save changes
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              data-dismiss="modal"
                            >
                                Close
                            </button>
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
                    "label": "Channel Group Name",
                    "channels": [
                        {
                            "id": 0,
                            "label": "DNA",
                            "color": "0000ff",
                            "min": 0.05,
                            "max": 0.95
                        },
                        {
                            "id": 1,
                            "label": "Channel 1",
                            "color": "ff0000",
                            "min": 0.01,
                            "max": 0.3
                        },
                        {
                            "id": 2,
                            "label": "Channel 2",
                            "color": "ffffff",
                            "min": 0.01,
                            "max": 0.3
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