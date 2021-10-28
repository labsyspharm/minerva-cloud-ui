import React from 'react';
import {Badge, Breadcrumb, Col, Container, Row} from "react-bootstrap";

import Client from "../MinervaClient";

import "../css/RepositoryView.css";
import {Link} from "@reach/router";
import RepoHeader from "../components/RepoHeader";

class RepositoryView extends React.Component {
  constructor(props) {
    super(props);
    console.log(props.repositoryUuid);

    this.state = {
      images: [],
      repo_name: null,
      repo_access: null,
      loading: true
    }
  }

  componentDidMount() {
    this.loadImages();
  }

  loadImages() {
    Client.getRepository(this.props.repositoryUuid).then(resp => {
      console.log(resp);
      this.setState({
        repo_name: resp.data.name,
        repo_access: resp.data.access
      });
    });
    Client.listImagesInRepository(this.props.repositoryUuid).then(resp => {
      // Handle a good response.
      console.log(resp)
      let images = []
      for (let image of resp.data) {
        images.push({
          name: image.name,
          uuid: image.uuid,
          compression: image.compression,
          format: image.format,
          pyramid_levels: image.pyramid_levels,
          tile_size: image.tile_size,
          deleted: image.deleted
        });

        this.setState({
          images: images,
          loading: false
        });
      }
    }).catch(err => {
      // Handle an error.
      console.error(err);
    })
  }

  render() {
    if (!this.state.repo_name) {
      return null;
    }
    return (
      <>
        <RepoHeader
          path_list={[
            {elem: "Repositories", link: "/repositories"},
            {elem: this.state.repo_name, link: null}
          ]}
        />
        <div className="repository-view">
          <Container>
            <div>
              <b>UUID:</b> { this.props.repositoryUuid }
            </div>
            <hr/>
            { this.state.loading && "Loading..." }
            { this.state.images.map((img, idx) => (
              <div className="img-line" key={img.uuid}>
                <Row>
                  <Col lg="3">
                    <Link to={`/images/${img.uuid}`} className="img-link">{ img.name }</Link>
                    <Badge variant="primary">{ img.format }</Badge>
                    { img.deleted && <Badge variant="danger">Deleted</Badge> }
                  </Col>
                  <Col lg="4">
                    { img.uuid }
                  </Col>
                  <Col lg="1">
                    { img.tile_size }
                  </Col>
                  <Col>
                    { img.pyramid_levels }
                  </Col>
                  <Col lg="1">
                    { img.compression }
                  </Col>
                  <Col lg="2" className="text-right">
                    sample
                  </Col>
                </Row>
              </div>
            )) }
          </Container>
        </div>
      </>
    )
  }
}

export default RepositoryView;