import React, { Component } from "react";
import { Form } from "react-bootstrap";
import { Modal, Button, Row, Col } from "react-bootstrap";
import Joi from "joi-browser";

class AddForm extends Component {
  //state = { movie: getMovie() };
  constructor(props) {
    super(props);
    this.state = {
      formData: props.formData,
      errors: {},
    };
  }

  schema = {
    firstname: Joi.string().required().label("First Name"),
    description: Joi.string().required(),
  };

  validate = () => {
    const options = {
      abortEarly: false,
      allowUnknown: true,
    };
    const result = Joi.validate(this.state.formData, this.schema, options);
    if (!result.error) return null;
    const errors = {};

    for (let item of result.error.details) {
      errors[item.path[0]] = item.message;
    }
    return errors;
  };
  validateProperty = ({ name, value }) => {
    const obj = { [name]: value };
    const schema = { [name]: this.schema[name] };
    const { error } = Joi.validate(obj, schema);
    return error ? error.details[0].message : null;
  };

  handleChange = ({ currentTarget: input }) => {
    const errors = { ...this.state.errors };
    const errorMessage = this.validateProperty(input);
    if (errorMessage) errors[input.name] = errorMessage;
    else delete errors[input.name];

    const formData = { ...this.state.formData };
    formData[input.name] = input.value;
    this.setState({ formData, errors });
  };
  submitForm = (e) => {
    e.preventDefault();
    const errors = this.validate();
    const formData = this.state.formData;
    this.setState({ errors: errors || {} });

    if (errors) return;
    //console.log("rowIndex" in formData && "id" in formData);
    if (
      formData.rowIndex &&
      formData.rowIndex !== "" &&
      formData.id &&
      formData.id !== ""
    ) {
      this.props.onSubmit(formData.rowIndex, formData);
    } else {
      this.props.onSubmit(formData);
    }

    return false;
  };
  render() {
    const { show, hideModal } = this.props;
    const { formData } = this.state;
    const {
      id,
      firstname,
      middlename,
      lastname,
      description,
      rowIndex,
    } = this.state.formData;
    const { errors } = this.state;

    return (
      <div>
        <Modal
          dialogClassName="modal-90w"
          show={show}
          backdrop="static"
          onHide={() => hideModal()}
          keyboard={false}
        >
          <form
            onSubmit={(e) => {
              return this.submitForm(e);
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>Add Account Type</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div>
                <Row>
                  <Col>
                    <Form.Group as={Row} controlId="firstname">
                      <Form.Label column sm="4">
                        First Name
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          size="sm"
                          type="text"
                          name="firstname"
                          value={firstname}
                          onChange={this.handleChange}
                          isInvalid={!!errors.firstname}
                        />
                      </Col>
                      <Form.Control.Feedback type="invalid">
                        {errors.firstname}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group as={Row} controlId="middlename">
                      <Form.Label column sm="4">
                        Middle Name
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          size="sm"
                          type="text"
                          name="middlename"
                          value={middlename}
                          onChange={this.handleChange}
                          isInvalid={!!errors.middlename}
                        />
                      </Col>
                      <Form.Control.Feedback type="invalid">
                        {errors.middlename}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group as={Row} controlId="lastname">
                      <Form.Label column sm="4">
                        Last Name
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          size="sm"
                          type="text"
                          name="lastname"
                          value={lastname}
                          onChange={this.handleChange}
                          isInvalid={!!errors.lastname}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.lastname}
                        </Form.Control.Feedback>
                      </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="description">
                      <Form.Label column sm="4">
                        Description
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          as="textarea"
                          rosw={3}
                          name="description"
                          value={description}
                          onChange={this.handleChange}
                          isInvalid={!!errors.description}
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.description}
                        </Form.Control.Feedback>
                      </Col>
                    </Form.Group>
                    <input type="hidden" name="rowIndex" value={rowIndex} />
                    <input type="hidden" name="id" value={id} />
                  </Col>
                  <Col>
                    <Form.Group as={Row} controlId="formData.Address1">
                      <Form.Label column sm="4">
                        Street Address
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          size="sm"
                          type="text"
                          name="Address1"
                          value={formData.Address1}
                          onChange={this.handleChange}
                          isInvalid={!!errors.Address1}
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.Address1}
                        </Form.Control.Feedback>
                      </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId="formData.Address2">
                      <Form.Label column sm="4">
                        Apt/Suite No
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          size="sm"
                          type="text"
                          name="Address2"
                          value={formData.Address2}
                          onChange={this.handleChange}
                          isInvalid={!!errors.Address2}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.Address2}
                        </Form.Control.Feedback>{" "}
                      </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId="formData.City">
                      <Form.Label column sm="4">
                        City
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          size="sm"
                          type="text"
                          name="City"
                          value={formData.City}
                          onChange={this.handleChange}
                          isInvalid={!!errors.City}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.City}
                        </Form.Control.Feedback>{" "}
                      </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId="formData.ZipCode">
                      <Form.Label column sm="4">
                        ZipCode
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          size="sm"
                          type="text"
                          name="ZipCode"
                          value={formData.ZipCode}
                          onChange={this.handleChange}
                          isInvalid={!!errors.ZipCode}
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.ZipCode}
                        </Form.Control.Feedback>
                      </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId="formData.Phone">
                      <Form.Label column sm="4">
                        Phone Number
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          size="sm"
                          type="text"
                          name="Phone"
                          value={formData.Phone}
                          onChange={this.handleChange}
                          isInvalid={!!errors.Phone}
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.Phone}
                        </Form.Control.Feedback>
                      </Col>
                    </Form.Group>
                  </Col>
                  <Col></Col>
                </Row>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="btn btn-sm btn-secondary"
                variant="secondary"
                onClick={() => hideModal()}
              >
                Close
              </Button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                variant="primary"
              >
                Save
              </button>
            </Modal.Footer>
          </form>
        </Modal>
      </div>
    );
  }
}

export default AddForm;
