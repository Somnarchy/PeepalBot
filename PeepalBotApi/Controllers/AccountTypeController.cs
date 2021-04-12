using EFPeepalbot;
using PeepalBotApi.Models;
using PeepalBotApi.Services;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace PeepalBotApi.Controllers
{
    [Authorize]
    public class AccountTypeController : ApiController
    {
        private AccountTypeService _service;
        public AccountTypeController()
        {
            _service = new AccountTypeService();
        }
        // GET: api/AccountType
        public IEnumerable<AccountType> Get()
        {
            return _service.GetList();
        }

        // GET: api/AccountType/5
        public AccountType Get(int id)
        {
            return _service.GetDetails(id);
        }

        // POST: api/AccountType
        public IHttpActionResult Post([FromBody]AccountType model)
        {
            _service.Create(model);            
            return Ok(model);
        }

        // PUT: api/AccountType/5
        public IHttpActionResult Put([FromBody]AccountType model)
        {
            _service.Update(model);
            return Ok(model);
        }

        // DELETE: api/AccountType/5       
        public IHttpActionResult Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Not a valid id");

            _service.Delete(id);
            return Ok();
        }
    }

}
