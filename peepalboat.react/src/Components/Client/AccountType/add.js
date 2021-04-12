import React, { Component } from "react";
import { Form } from "react-bootstrap";
import { Modal, Button } from "react-bootstrap";
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
    name: Joi.string().required().label("Name"),
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
    const { id, name, description, rowIndex } = this.state.formData;
    const { errors } = this.state;

    return (
      <div>
        <Modal
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
                <Form.Group controlId="{name}">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={name}
                    onChange={this.handleChange}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="{description}">
                  <Form.Label>Description</Form.Label>
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
                </Form.Group>
                <input type="hidden" name="rowIndex" value={rowIndex} />
                <input type="hidden" name="id" value={id} />
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
