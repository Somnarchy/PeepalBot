using EFPeepalbot;
using PeepalBotApi.Models;
using PeepalBotApi.Services;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace PeepalBotApi.Controllers
{
    [Authorize]
    public class CustomerController : ApiController
    {
        private CustomerService _service;
        public CustomerController()
        {
            _service = new CustomerService();
        }
        // GET: api/Customer
        public IEnumerable<Customer> Get()
        {
            return _service.GetList();
        }

        // GET: api/Customer/5
        public Customer Get(int id)
        {
            return _service.GetDetails(id);
        }

        // POST: api/Customer
        public IHttpActionResult Post([FromBody]Customer model)
        {
            _service.Create(model);            
            return Ok(model);
        }

        // PUT: api/Customer/5
        public IHttpActionResult Put([FromBody]Customer model)
        {
            _service.Update(model);
            return Ok(model);
        }

        // DELETE: api/Customer/5       
        public IHttpActionResult Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Not a valid id");

            _service.Delete(id);
            return Ok();
        }
    }

}
