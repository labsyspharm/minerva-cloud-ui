import React from 'react';

class ImagePreview extends React.Component {

    render() {
        if (!this.props.imageSrc) {
            return null;
        }
        return (
            <div className="thumbnailContainer">
                <img className="thumbnailImg" src={this.props.imageSrc} alt={this.props.title}/>
                <h5 className="card-title">{ this.props.title }</h5>
            </div>
        );
    }

}

export default ImagePreview;