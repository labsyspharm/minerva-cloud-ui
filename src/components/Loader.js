import React from "react";
import '../css/loader.css';

export default class Loader extends React.Component {
    render() {
        if (!this.props.active) {
            return null;
        }
        let clazz = "minerva-spinner-image";
        if (this.props.size === "small") {
            clazz += ' small';
        } else if (this.props.size === "large") {
            clazz += ' large';
        }
        return (
           <div id="minerva-spinner" className="ui inline text small">
               <img alt="spinner" className={clazz} src="Minerva_FinalLogo_NoText_RGB.svg" />
               {this.props.text}
            </div>
        );
    }
}