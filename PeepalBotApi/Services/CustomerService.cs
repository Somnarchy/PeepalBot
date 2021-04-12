using EFPeepalbot;
using EFPeepalbot.Repository;
using PeepalBotApi.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace PeepalBotApi.Services
{
   
    public class CustomerService
    {       
        private CustomerRepository _repository { get; set; }

        public CustomerService()
        {
            _repository = new CustomerRepository();

        }
        public List<Customer> GetList()
        {
            return _repository.GetList();
        }

        public Customer GetDetails(int Id)
        {
            return _repository.GetDetails(Id);
        }

        public int Create(Customer model)
        {
            return _repository.Save(model);
        }

        public void Update(Customer model)
        {

            _repository.Update(model);
        }

        public void Delete(int id)
        {
            _repository.Delete(id);
        }

        public List<SelectListItem> GetSelectList()
        {
           
            var list = GetList();

            var accountTypeSelectList = new List<SelectListItem>();

            if (list != null)
            {
                foreach (var item in list)
                {
                    var selectItem = new SelectListItem
                    {
                        Text = $"{item.FirstName}{(item.MiddleName != null ? $" {item.MiddleName}" : "")} {item.LastName}",
                        Value = item.Id.ToString(),
                    };
                    accountTypeSelectList.Add(selectItem);
                } 
            }

            return accountTypeSelectList;
        }
       
    }
}