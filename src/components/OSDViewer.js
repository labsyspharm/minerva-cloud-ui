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

        this.tileSources = {};
        this.rendering = false;

        this.accept = "image/jpeg";
        this.check_webp_feature('lossy', (supported) => {
            if (supported) {
                this.accept = "image/webp";
            }
        });
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
                visibilityRatio: 0.50,
                maxImageCacheCount: 500
            });
            viewer.addHandler('tile-load-failed', (e) => {
                console.error(e);
            });
            this.setState({ viewer: viewer });
        }

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.metadata) {
            let imageChanged = !prevProps || !prevProps.metadata || (this.props.metadata.image_uuid !== prevProps.metadata.image_uuid);
            let activeChannelGroupChanged = prevProps.activeGroup && prevProps.activeGroup.uuid !== this.props.activeGroup.uuid;
            let channelsChanged = this._channelsChanged(prevProps.channels, this.props.channels);
            if (imageChanged) {
                // Image has changed -> Clear world and add all channel groups as TiledImages
                this._hideAllItems();
                this.rendering = false;

                // TODO Changing image could be optimized, the world does not have to be cleared.
                // Would need some logic to decide which images need to be added to the world,
                // and which are already in the world and can be just shown.
                this.createTileSource(this.props.channelGroups, true);
            } 
            else if (activeChannelGroupChanged) {
                // Image is the same but active channel group has been changed
                // Make the selected channel group visible and all others opaque
                this._hideAllItems();
                let tileSource = this.tileSources[this.props.activeGroup.uuid];
                if (tileSource) {
                    this.tileSources[this.props.activeGroup.uuid].setOpacity(1);
                } else {
                    // New channel group added, it does not yet exist in tileSources
                    // Clear world and add all channel groups again
                    this.createTileSource(this.props.channelGroups, true);
                }
            }
            else if (this.props.activeGroup.isRawRender && (!this.rendering || !this.props.ignoreRenderUpdate)) {
                // Image and active channel group are the same
                // Channel rendering settings have been changed

                // Raw rendering is handled a bit differently from prerendered channel groups.
                // Every time channel settings are changed, we have to add the image to the world,
                // but at the same time we must hide / delete the old image.

                // TODO If OSD would support changing getTileUrl dynamically, this could be averted.
                // Could not find a way so far...
                this.createRawImage(this.props.activeGroup);
            }
        }

    }

    _hideAllItems() {
        Object.keys(this.tileSources).forEach((key, index) => {
            this.tileSources[key].setOpacity(0);
        });
    }

    _channelsChanged(prevChannels, channels) {
        if (!prevChannels) {
            return true;
        }
        return this._channelsHash(prevChannels) !== this._channelsHash(channels);
    }

    _channelsHash(channels) {
        let hash = [];
        for (let channel of channels) {
            hash.push([channel.id.toString(), channel.min.toString(), channel.max.toString(), channel.color].join(','));
        }
        return hash.join(';');
    }

    createTileSource(channelGroups, clear=false) {
        if (clear) {
            this.state.viewer.world.removeAll();
            console.log('Clear world');
        }

        Client.getToken().then(token => {
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': token,
                'Accept': this.accept
            };

            for (let channelGroup of channelGroups) {
                console.log('Channel group :', channelGroup);

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
                        getTileUrl: this.createRenderUrl(channelGroup)
                    },
                    opacity: 0,
    
                    success: (evt) => {
                        this.tileSources[channelGroup.uuid] = evt.item;
                    }
                };

                if (this.props.activeGroup.uuid === channelGroup.uuid) {
                    options.opacity = 1;
                }
    
                this.state.viewer.addTiledImage(options);
            }

        });

    }

    createRawImage(channelGroup) {
        if (!channelGroup.channels || channelGroup.channels.length === 0) {
            this.state.viewer.world.removeAll();
            return;
        }
        this.rendering = true;
        Client.getToken().then(token => {
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': token,
                'Accept': this.accept
            };

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
                    getTileUrl: this.createRenderUrl(channelGroup)
                },
                opacity: 1,

                success: (evt) => {
                    let tiledImage = evt.item;
                    let ready = () => {
                        this._hideAllItems();
                        tiledImage.setOpacity(1);

                        let oldItem = this.tileSources[channelGroup.uuid];
                        if (oldItem) {
                            this.state.viewer.world.removeItem(oldItem);
                        }
                        this.tileSources[channelGroup.uuid] = evt.item;
                        setTimeout(() => {
                            this.rendering = false;
                        }, 50);
                      }
                    
                    if (tiledImage.getFullyLoaded()) {
                       ready();
                    } else {
                       tiledImage.addOnceHandler('fully-loaded-change', ready);
                    }
                    
                }
            };

            this.state.viewer.addTiledImage(options);

        });

    }

    createRenderUrl(channelGroup) {
        if (channelGroup.isRawRender) {
            return this.createRenderTileUrl();
        } else {
            return this.createPrerenderedTileUrl(channelGroup);
        }
    }

    createRenderTileUrl() {
        return (level, x, y) => {
            let channelPath = '';

            let paths = [];
            for (let channel of this.props.channels) {
                if (channel.disabled) {
                    continue;
                }
                let path = `${channel.id},${channel.color},${channel.min},${channel.max}`;
                paths.push(path);
            }
            channelPath = paths.join('/');

            const api = Client.baseUrl + '/image/' + this.props.metadata.image.uuid + '/render-tile/';
            const lod = (this.props.metadata.image.pyramid_levels - level  ) + '/';
            const pos = x + '/' + y + '/0/0/';
            const url = api + pos + lod + channelPath + '?gamma=1';
            return url;
        };
    }

    createPrerenderedTileUrl(channelGroup) {
        return (level, x, y) => {
            const api = Client.baseUrl + '/image/' + this.props.metadata.image.uuid + '/prerendered-tile/';
            const lod = (this.props.metadata.image.pyramid_levels - level );
            const pos = x + '/' + y + '/0/0/';
            const url = api + pos + lod + '/' + channelGroup.uuid;
            return url;
        };
    }

    render() {
        return (
            <div className="osdContainer" ref={this.osdRef}>
                <span className="osdZoomIn" ref={this.zoomInRef} />
                <span className="osdZoomOut" ref={this.zoomOutRef} />
            </div>
        );
    }

    // check_webp_feature:
    //   'feature' can be one of 'lossy', 'lossless', 'alpha' or 'animation'.
    //   'callback(feature, isSupported)' will be passed back the detection result (in an asynchronous way!)
    check_webp_feature(feature, callback) {
        var kTestImages = {
            lossy: "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
            lossless: "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
            alpha: "UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==",
            animation: "UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"
        };
        var img = new Image();
        img.onload = function () {
            var result = (img.width > 0) && (img.height > 0);
            callback(feature, result);
        };
        img.onerror = function () {
            callback(feature, false);
        };
        img.src = "data:image/webp;base64," + kTestImages[feature];
    }

}

export default OSDViewer;