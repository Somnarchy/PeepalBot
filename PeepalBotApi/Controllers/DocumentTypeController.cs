using EFPeepalbot;
using PeepalBotApi.Models;
using PeepalBotApi.Services;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace PeepalBotApi.Controllers
{
    [Authorize]
    public class DocumentTypeController : ApiController
    {
        private DocumentTypeService _service;
        public DocumentTypeController()
        {
            _service = new DocumentTypeService();
        }
        // GET: api/DocumentType
        public IEnumerable<DocumentType> Get()
        {
            return _service.GetList();
        }

        // GET: api/DocumentType/5
        public DocumentType Get(int id)
        {
            return _service.GetDetails(id);
        }

        // POST: api/DocumentType
        public IHttpActionResult Post([FromBody]DocumentType model)
        {
            _service.Create(model);            
            return Ok(model);
        }

        // PUT: api/DocumentType/5
        public IHttpActionResult Put([FromBody]DocumentType model)
        {
            _service.Update(model);
            return Ok(model);
        }

        // DELETE: api/DocumentType/5       
        public IHttpActionResult Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Not a valid id");

            _service.Delete(id);
            return Ok();
        }
    }

}
