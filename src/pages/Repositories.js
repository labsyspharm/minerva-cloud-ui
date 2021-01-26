import React from 'react';
import Client from './../MinervaClient';
import RepositoryTree from './../components/RepositoryTree';
import ChannelGroups from '../components/ChannelGroups';
import '../css/Repository.css';
import ImageMetadata from '../components/ImageMetadata';
import OSDViewer from '../components/OSDViewer';
import RenderingSettings from '../components/RenderingSettings';
import Loader from '../components/Loader';

class Repositories extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            repositories: [],
            nodes: [],
            selectedImage: null,
            imageSrc: null,
            imageDetails: null,
            loading: false,
            osdMetadata: null,
            channels: [],
            channelGroups: [],
            selectedChannelGroup: null,
            renderMode: 'renderTile',
            ignoreRenderUpdate: false,
        };

        this.select = this.select.bind(this);
        this.selectChannelGroup = this.selectChannelGroup.bind(this);
        this.onRenderingSettingsChanged = this.onRenderingSettingsChanged.bind(this);
        this.onChannelDeleted = this.onChannelDeleted.bind(this);
        this.onChannelAdded = this.onChannelAdded.bind(this);
        this.autoSettings = this.autoSettings.bind(this);

    }

    componentDidMount() {
        const urlParams = new URLSearchParams(window.location.search);
        const imageUuid = urlParams.get('image');
        if (imageUuid) {
            this.select(imageUuid);
        }
    }

    select(imageUuid, node) {
        window.history.replaceState(null, null, `?image=${imageUuid}`);

        let renderMode = this.props.guest ? 'prerenderedTile' : 'renderTile';
        this.setState({ selectedImage: null, 
            channels: [], 
            renderMode: renderMode,
            loading: true });

        let getImageResponse = Client.getImage(imageUuid);
        let getImageDimensionsResponse = Client.getImageDimensions(imageUuid);

        Promise.all([getImageResponse, getImageDimensionsResponse]).then(values => {
            let imageResponse = values[0];
            let dimensions = values[1];

            let channelGroups = [];
            if (!this.props.guest) {
                // Guest mode does not support raw rendering, so add the default
                // raw channel group only if logged in.
                channelGroups.push(this._createRawChannelGroup(imageUuid, dimensions));
            }

            if (imageResponse.included && imageResponse.included.rendering_settings && imageResponse.included.rendering_settings.length > 0) {
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
            osdMetadata.image = imageResponse.data;
            this.setState({imageDetails: osdMetadata, 
                osdMetadata: osdMetadata, 
                channelGroups: channelGroups,
                selectedChannelGroup: selectedChannelGroup,
                renderMode: renderMode,
                channels: selectedChannelGroup.channels,
                selectedImage: imageResponse.data,
                loading: false
            });

        });
    }

    _createRawChannelGroup(imageUuid, dimensions) {
        let rgbChannels = [
            {
                label: 'Red',
                id: 0,
                min: 0,
                max: 1,
                color: 'ff0000'
            },
            {
                label: 'Green',
                id: 1,
                min: 0,
                max: 1,
                color: '00ff00'
            },
            {
                label: 'Blue',
                id: 2,
                min: 0,
                max: 1,
                color: '0000ff'
            }
        ];
        let dnaChannels = [
            {
                label: 'Channel 0',
                id: 0,
                min: 0.03,
                max: 0.85,
                color: 'ffffff'
            }
        ];
        let channels = dimensions.data.pixels.SizeC === 3 ? rgbChannels : dnaChannels;
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
                <div className="viewer overflow-hidden">
                    <OSDViewer metadata={this.state.osdMetadata} 
                        activeGroup={this.state.selectedChannelGroup}
                        channelGroups={this.state.channelGroups}
                        channels={this.state.channels} 
                        ignoreRenderUpdate={this.state.ignoreRenderUpdate} />
                    <div className="minerva-loader-center">
                        <Loader active={this.state.loading} size="large" />
                     </div>
                    
                </div>
                { this.renderLeftHandPanel() }
                { this.renderRightHandPanel() }
            </div>

        );
    }

    renderLeftHandPanel() {
        return (
            <div className="navigator">
                <RepositoryTree onSelect={this.select} refresh={this.props.refresh}/>
            </div>
        );
    }

    renderRightHandPanel() {
        if (!this.state.selectedImage) {
            return null;
        }
        return (
        <div className="metadata">
            <h5 className="h5 text-left">METADATA</h5>
            <ImageMetadata metadata={this.state.imageDetails} image={this.state.selectedImage} />
            <hr/>
            
            <ChannelGroups groups={this.state.channelGroups} 
                onChannelGroupSelected={this.selectChannelGroup} 
                node={this.state.selectedImage} 
                selectedItem={this.state.selectedChannelGroup}
                guest={this.props.guest}
                channels={this.state.channels}
                image={this.state.selectedImage}
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