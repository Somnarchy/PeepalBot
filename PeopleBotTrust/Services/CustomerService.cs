using EFPeopleBotTrust;
using EFPeopleBotTrust.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PeopleBotTrust.Services
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
            model.CreatedBy = "1";// should come from session logged Id
            model.CreatedDate = DateTime.Now;
            return _repository.Save(model);
        }

        public void Update(Customer model)
        {
            model.ModifiedBy = "1";// should come from session logged Id
            model.ModifiedDate = DateTime.Now;
            _repository.Update(model);
        }

        public void Delete(int id)
        {
            _repository.Delete(id);
        }

        public List<SelectListItem> GetSelectList()
        {
            var customerList = GetList();

            var customerSelectList = new List<SelectListItem>();

            if (customerList != null)
            {
                foreach (var item in customerList)
                {
                    var selectItem = new SelectListItem
                    {
                        Text = $"{item.FirstName} {item.LastName}",
                        Value = item.Id.ToString(),
                    };
                    customerSelectList.Add(selectItem);
                }

            }
            return customerSelectList;
        }
    }
}