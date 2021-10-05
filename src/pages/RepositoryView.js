import React from 'react';
import {Container} from "react-bootstrap";

class RepositoryView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {}
  }

  render() {
    return (
      <div className="repository-view">
        <Container>
          Repo Name
        </Container>
      </div>
    )
  }
}

export default RepositoryView;