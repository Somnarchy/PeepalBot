using EFPeepalbot;
using EFPeepalbot.Repository;
using PeepalBotApi.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace PeepalBotApi.Services
{
   
    public class CustomerDocumentService
    {       
        private CustomerDocumentRepository _repository { get; set; }

        public CustomerDocumentService()
        {
            _repository = new CustomerDocumentRepository();

        }
        public List<CustomerDocument> GetList()
        {
            return _repository.GetList();
        }

        public CustomerDocument GetDetails(int Id)
        {
            return _repository.GetDetails(Id);
        }

        public int Create(CustomerDocument model)
        {
            return _repository.Save(model);
        }

        public void Update(CustomerDocument model)
        {

            _repository.Update(model);
        }

        public void Delete(int id)
        {
            _repository.Delete(id);
        }
       
    }
}