import React from 'react';
import Client from './../MinervaClient';
import RepositoryTree from './../components/RepositoryTree';
import ImagePreview from './../components/ImagePreview';
import ChannelGroups from '../components/ChannelGroups';
import '../css/Repository.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import ImageMetadata from '../components/ImageMetadata';
import OSDViewer from '../components/OSDViewer';

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
            osdMetadata: null
        };

        this.select = this.select.bind(this);
        this.selectChannelGroup = this.selectChannelGroup.bind(this);
    }

    select(node) {
        this.setState({ selected: node });
        let image = node.data;
        this.setState({previewSpinner: true});
        let getImageResponse = Client.getImage(node.uuid);
        let getImageDimensionsResponse = Client.getImageDimensions(node.uuid);

        Promise.all([getImageResponse, getImageDimensionsResponse]).then(values => {
            let response = values[0];
            let renderingSettings = [];
            let channelGroups = [];
            if (response.included && response.included.rendering_settings && response.included.rendering_settings.length > 0) {
                renderingSettings = response.included.rendering_settings[0];
                channelGroups = response.included.rendering_settings;
            }

            response = values[1];
            let osdMetadata = {};
            Object.assign(osdMetadata, response.data);
            osdMetadata.image = image;
            osdMetadata.renderingSettingsUuid = renderingSettings.uuid;
            this.setState({imageDetails: osdMetadata, osdMetadata: osdMetadata, channelGroups: channelGroups});

        });

    }

    selectChannelGroup(uuid) {
        let osdMetadata = {};
        Object.assign(osdMetadata, this.state.osdMetadata);
        osdMetadata.renderingSettingsUuid = uuid;
        this.setState({osdMetadata: osdMetadata});
    }

    render() {
        if (!this.props.loggedIn) {
            return null;
        }
        return (
            <div className="row">
                <div className="navigator">
                    <h5 className="h5 text-left">REPOSITORIES</h5>
                    <RepositoryTree onSelect={this.select} refresh={this.props.refresh}/>
                </div>
                <div className="viewer overflow-hidden">
                    
                    <OSDViewer metadata={this.state.osdMetadata} />
                    
                </div>
                <div className="metadata">
                    <h5 className="h5">METADATA</h5>
                    <ImageMetadata metadata={this.state.imageDetails} image={this.state.selected} />
                    <hr/>
                    <h5 className="h5">CHANNEL GROUPS</h5>
                    <ChannelGroups groups={this.state.channelGroups} onChannelGroupSelected={this.selectChannelGroup}/>
                </div>
            </div>

        );
    }

    renderSpinner() {
        if (!this.state.previewSpinner) {
            return null;
        }
        return (
            <div className="thumbnailSpinner">
                <div className="spinner-border bg-dark" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

}

export default Repositories;