import React from 'react';
import OpenSeadragon from 'openseadragon';
import Client from '../MinervaClient';
import '../css/OSDViewer.css';

class OSDViewer extends React.Component {

    constructor(props) {
        super(props);

        this.osdRef = React.createRef();
        this.zoomInRef = React.createRef();
        this.zoomOutRef = React.createRef();
        this.renderTile = this.renderTile.bind(this);
        this.prerenderedTile = this.prerenderedTile.bind(this); 
    }

    componentDidMount() {
        if (this.osdRef.current) {
            console.log('Creating OpenSeadragon viewer');
            const viewer = OpenSeadragon({
                element: this.osdRef.current,
                prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/2.3.1/images/',
                showNavigationControl: false,
                immediateRender: true,
                maxZoomPixelRatio: 10,
                visibilityRatio: 0.75
            });
            this.setState({ viewer: viewer });
        }

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.metadata) {
            if (prevProps.metadata && prevProps.metadata.image_uuid === this.props.metadata.image_uuid && 
                prevProps.metadata.renderingSettingsUuid === this.props.metadata.renderingSettingsUuid) {
                    // componentDidUpdate is called twice when selecting an image ???
                    return;
                }
            let imageChanged = false;
            if (prevProps.metadata && prevProps.metadata.image_uuid !== this.props.metadata.image_uuid) {
                imageChanged = true;
            }
            this.createTileSource(imageChanged);
        }
    }

    createTileSource(clear=false) {
        Client.getToken().then(token => {
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': token,
                'Accept': 'image/jpeg'
            };
            let getTileFunction = this.props.metadata.renderingSettingsUuid ? this.prerenderedTile : this.renderTile;

            let options = {
                loadTilesWithAjax: true,
                crossOriginPolicy: 'Anonymous',
                ajaxHeaders: headers,
                tileSource: {
                    height: this.props.metadata.pixels.SizeY,
                    width: this.props.metadata.pixels.SizeX,
                    maxLevel: this.props.metadata.image.pyramid_levels,
                    tileWidth: 1024,
                    tileHeight: 1024,
                    getTileUrl: getTileFunction
                }
            };

            if (clear) {
                this.state.viewer.world.removeAll();

            } else {
                options.index = 1;
                options.replace = true;
            }
            
            this.state.viewer.addTiledImage(options);
        });

    }

    renderTile(level, x, y) {
        let channelPath = '0,FFFFFF,0,1';
        const api = Client.baseUrl + '/image/' + this.props.metadata.image.uuid + '/render-tile/';
        const lod = (this.props.metadata.image.pyramid_levels - level  ) + '/';
        const pos = x + '/' + y + '/0/0/';
        const url = api + pos + lod + channelPath + '?gamma=1';
        return url;
    }

    prerenderedTile(level, x, y) {
        const api = Client.baseUrl + '/image/' + this.props.metadata.image.uuid + '/prerendered-tile/';
        const lod = (this.props.metadata.image.pyramid_levels - level );
        const pos = x + '/' + y + '/0/0/';
        const url = api + pos + lod + '/' + this.props.metadata.renderingSettingsUuid;
        return url;
    }

    render() {
        return (
            <div className="osdContainer" ref={this.osdRef}>
                <span className="osdZoomIn" ref={this.zoomInRef} />
                <span className="osdZoomOut" ref={this.zoomOutRef} />
            </div>
        );
    }

}

export default OSDViewer;