import React from 'react';
import Client from './../MinervaClient';
import RepositoryTree from './../components/RepositoryTree';
import ChannelGroups from '../components/ChannelGroups';
import '../css/Repository.css';
import ImageMetadata from '../components/ImageMetadata';
import OSDViewer from '../components/OSDViewer';
import RenderingSettings from '../components/RenderingSettings';

class Repositories extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            repositories: [],
            nodes: [],
            selected: null,
            imageSrc: null,
            imageDetails: null,
            previewSpinner: false,
            osdMetadata: null,
            channels: [],
            channelGroups: [],
            selectedChannelGroup: null,
            renderMode: 'renderTile',
            ignoreRenderUpdate: false
        };

        this.select = this.select.bind(this);
        this.selectChannelGroup = this.selectChannelGroup.bind(this);
        this.onRenderingSettingsChanged = this.onRenderingSettingsChanged.bind(this);
        this.onChannelDeleted = this.onChannelDeleted.bind(this);
        this.onChannelAdded = this.onChannelAdded.bind(this);
        this.autoSettings = this.autoSettings.bind(this);
    }

    select(node) {
        let renderMode = this.props.guest ? 'prerenderedTile' : 'renderTile';
        this.setState({ selected: node, channels: [], renderMode: renderMode });

        let image = node.data;
        
        let getImageResponse = Client.getImage(node.uuid);
        let getImageDimensionsResponse = Client.getImageDimensions(node.uuid);
        console.log('getImageResponse: ', getImageResponse);
        console.log('getImageDimensions: ', getImageDimensionsResponse);

        Promise.all([getImageResponse, getImageDimensionsResponse]).then(values => {
            let imageResponse = values[0];
            let dimensions = values[1];

            if (!imageResponse) {
                // FIXME - should not need this check, investigate why reponse in undefined
                // when token has expired
                return;
            }
            let renderingSettings = [];
            let channelGroups = [];
            if (!this.props.guest) {
                // Guest mode does not support raw rendering, so add the default
                // raw channel group only if logged in.
                channelGroups.push(this._createRawChannelGroup(node.uuid, dimensions));
            }

            if (imageResponse.included && imageResponse.included.rendering_settings && imageResponse.included.rendering_settings.length > 0) {
                renderingSettings = imageResponse.included.rendering_settings[0];
                channelGroups.push(...imageResponse.included.rendering_settings);
            }

            let selectedChannelGroup = null;
            if (channelGroups.length > 1 && !this.props.guest) {
                selectedChannelGroup = channelGroups[1];
                renderMode = 'prerenderedTile';
            } else if (channelGroups.length > 0) {
                selectedChannelGroup = channelGroups[0];
            }

            let osdMetadata = {};
            Object.assign(osdMetadata, dimensions.data);
            osdMetadata.image = image;
            this.setState({imageDetails: osdMetadata, 
                osdMetadata: osdMetadata, 
                channelGroups: channelGroups,
                selectedChannelGroup: selectedChannelGroup,
                renderMode: renderMode,
                channels: selectedChannelGroup.channels
            });

        });
    }

    _createRawChannelGroup(imageUuid, dimensions=null) {
        let channels = [];
        let colors = ['0000ff', 'ff0000', 'ffffff', '00ff00',
                      '0000ff', 'ff0000', 'ff0000', '00ff00',
                      '0000ff', 'ff0000', 'ffffff', '00ff00',
                      '0000ff', 'ff0000', 'ffffff', '00ff00',
                      '0000ff', 'ff0000', 'ffffff', '00ff00'
        ];
        if (dimensions) {
            // Try to show channels 0, 6, 10, 11 by default.
            let defaultChannels = [0, 6, 10, 11];
            // If this fails it's okay, we can just show the DNA channel
            try {
                for (let i of defaultChannels) {
                    let label = dimensions.data.pixels.channels[i].Name;
                    let max = i == 0 ? 1 : 0.33;
                    channels.push(
                        {
                            label: label,
                            id: i,
                            min: 0.01,
                            max: max,
                            color: colors[i]
                        }
                    );
                }
                
            } catch (err) {}
        }
        if (channels.length === 0) {
            channels = [
                {
                    label: 'DNA',
                    id: 0,
                    min: 0,
                    max: 1,
                    color: 'ffffff'
                }
            ];
        }
        return {
            image_uuid: imageUuid,
            label: 'Raw',
            uuid: '00000000-0000-0000-0000-000000000000',
            channels: channels,
            isRawRender: true
        };
    }

    selectChannelGroup(item) {
        let osdMetadata = {};
        Object.assign(osdMetadata, this.state.osdMetadata);
        this.setState({osdMetadata: osdMetadata});

        let channels = [];
        for (let channel of item.channels) {
            let newChannel = {};
            Object.assign(newChannel, channel);
            channels.push(newChannel);
        }
        if (item.uuid !== '00000000-0000-0000-0000-000000000000') {
            item.isRawRender = false;
        }
        this.setState({channels: channels, selectedChannelGroup: item});
    }

    onRenderingSettingsChanged(updatedChannelGroup, updatedChannel, update=false) {
        let updatedChannels = [...this.state.channels];
        let index = -1;
        updatedChannels.map((ch, i) => {
            if (ch.id === updatedChannel.id) {
                index = i;
            }
        })
        if (index !== -1) {
            updatedChannels[index] = updatedChannel;
        }
        updatedChannelGroup.isRawRender = true;
        this.setState({channels: updatedChannels, 
            ignoreRenderUpdate: !update
        });
    }

    onChannelDeleted(channelGroup, channel) {
        let updatedChannels = this.state.channels.filter((value, index, arr) => {
            return value.id !== channel.id;
        });
        channelGroup.isRawRender = true;
        channelGroup.channels = updatedChannels;
        this.setState({channels: updatedChannels, 
            ignoreRenderUpdate: false,
            selectedChannelGroup: channelGroup
        });
    }

    onChannelAdded(index) {
        let usedIds = [];
        this.state.channels.map((channel, idx) => {
            usedIds.push(channel.id);
        });
        if (usedIds.includes(index)) {
            return;
        }
        let i=0;
        let updatedChannels = [...this.state.channels];

        if (!index) {
            for (let i=0; i<this.state.imageDetails.pixels.channels.length; i++) {
                if (!usedIds.includes(i)) {
                    index = i;
                    break;
                }
            }
        }
        // Default to DNA channel values
        let color = 'ffffff';
        let min = 0;
        let max = 1;
        if (index % 4 !== 0) {
            // Other than DNA channel
            let colorValues = ['00', '80', 'ff'];
            const red = colorValues[Math.floor(Math.random() * colorValues.length)];
            const green =  colorValues[Math.floor(Math.random() * colorValues.length)];
            const blue = colorValues[Math.floor(Math.random() * colorValues.length)];
            color = red + green + blue;
            if (color === '000000') {
                color = 'ffffff';
            }
            min = 0.01;
            max = 0.4;
        }

        updatedChannels.push(
            {
                label: this.state.imageDetails.pixels.channels[index].Name,
                id: index,
                min: min,
                max: max,
                color: color
            });

        this.state.selectedChannelGroup.channels = updatedChannels;
        this.setState({channels: updatedChannels, 
            ignoreRenderUpdate: false,
            selectedChannelGroup: this.state.selectedChannelGroup
        });
    }

    autoSettings(res) {
        console.log(res);
        let updatedChannels = [...this.state.channels];
        for (let origChannel of updatedChannels) {
            for (let histChannel of res.channels) {
                if (histChannel.id == origChannel.id) {
                    origChannel.min = histChannel.min;
                    origChannel.max = histChannel.max;
                    continue;
                }
            }
        }
        this.state.selectedChannelGroup.channels = updatedChannels;
        this.state.selectedChannelGroup.isRawRender = true;
        this.setState({channels: updatedChannels, 
            ignoreRenderUpdate: false,
            selectedChannelGroup: this.state.selectedChannelGroup
        });
    }

    render() {
        if (!this.props.loggedIn) {
            return null;
        }
        return (
            <div className="row">
                <div className="navigator">
                    <RepositoryTree onSelect={this.select} refresh={this.props.refresh}/>
                </div>
                <div className="viewer overflow-hidden">
                    
                    <OSDViewer metadata={this.state.osdMetadata} 
                        activeGroup={this.state.selectedChannelGroup}
                        channelGroups={this.state.channelGroups}
                        channels={this.state.channels} 
                        ignoreRenderUpdate={this.state.ignoreRenderUpdate} />
                    
                </div>
                { this.renderRightHandPanel() }
            </div>

        );
    }

    renderRightHandPanel() {
        if (!this.state.selected) {
            return null;
        }
        return (
        <div className="metadata">
            <h5 className="h5">METADATA</h5>
            <ImageMetadata metadata={this.state.imageDetails} image={this.state.selected} />
            <hr/>
            
            <ChannelGroups groups={this.state.channelGroups} 
                onChannelGroupSelected={this.selectChannelGroup} 
                node={this.state.selected} 
                selectedItem={this.state.selectedChannelGroup}
                guest={this.props.guest}
                channels={this.state.channels}
                image={this.state.selected}
                onAutoSettings={this.autoSettings}
            />
            <div className="rendering-settings">
                <RenderingSettings channelGroup={this.state.selectedChannelGroup} 
                    metadata={this.state.imageDetails}
                    handleChange={this.onRenderingSettingsChanged} 
                    onDelete={this.onChannelDeleted}
                    onAdd={this.onChannelAdded}
                    guest={this.props.guest}/>
            </div>
        </div>
        );
    }

}

export default Repositories;