import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

class Spinner extends React.Component {

    render() {
        return (
            <span>
                {this.props.show ? <FontAwesomeIcon icon={faSpinner} spin></FontAwesomeIcon> : null}
            </span>
        );
    }
}

export default Spinner;