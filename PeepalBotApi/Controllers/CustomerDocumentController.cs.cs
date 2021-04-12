using EFPeepalbot;
using PeepalBotApi.Models;
using PeepalBotApi.Services;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace PeepalBotApi.Controllers
{
    [Authorize]
    public class CustomerDocumentController : ApiController
    {
        private CustomerDocumentService _service;
        public CustomerDocumentController()
        {
            _service = new CustomerDocumentService();
        }
        // GET: api/CustomerDocument
        public IEnumerable<CustomerDocument> Get()
        {
            return _service.GetList();
        }

        // GET: api/CustomerDocument/5
        public CustomerDocument Get(int id)
        {
            return _service.GetDetails(id);
        }

        // POST: api/CustomerDocument
        public IHttpActionResult Post([FromBody]CustomerDocument model)
        {
            _service.Create(model);            
            return Ok(model);
        }

        // PUT: api/CustomerDocument/5
        public IHttpActionResult Put([FromBody]CustomerDocument model)
        {
            _service.Update(model);
            return Ok(model);
        }

        // DELETE: api/CustomerDocument/5       
        public IHttpActionResult Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Not a valid id");

            _service.Delete(id);
            return Ok();
        }
    }

}
