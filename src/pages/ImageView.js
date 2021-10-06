import React from "react";
import {Badge, Breadcrumb, Col, Container, Row} from "react-bootstrap";


class ImageView extends React.Component {
  render() {
    return (
      <div className="image-view">
        <Container>
          <Breadcrumb>
            <Breadcrumb.Item>
              Repositories
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              Repo-Name
            </Breadcrumb.Item>
            <Breadcrumb.Item active>
              Image-Name
            </Breadcrumb.Item>
          </Breadcrumb>
          Image viewer
        </Container>
      </div>
    )
  }
}

export default ImageView;
