import React from 'react';

class ImageMetadata extends React.Component {

    render() {
        if (!this.props.metadata) {
            return null;
        }
        let pixels = this.props.metadata.pixels;
        return (
            <table className="imageDetails" cellPadding="5">
                <tbody>
                <tr><td>Uuid:</td><td>{this.props.metadata.image_uuid}</td></tr>
                <tr><td>Channels:</td><td>{pixels.SizeC}</td></tr>
                <tr><td>Width:</td><td>{pixels.SizeX}</td></tr>
                <tr><td>Height:</td><td>{pixels.SizeY}</td></tr>
                <tr><td>Z-Levels:</td><td>{pixels.SizeZ}</td></tr>
                </tbody>
            </table>
        );
    }

}

export default ImageMetadata;