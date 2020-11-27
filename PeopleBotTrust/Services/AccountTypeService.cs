using EFPeopleBotTrust;
using EFPeopleBotTrust.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PeopleBotTrust.Services
{
    public class AccountTypeService
    {       
        private AccountTypeRepository _repository { get; set; }

        public AccountTypeService()
        {
            _repository = new AccountTypeRepository();

        }
        public List<AccountType> GetList()
        {            
            return _repository.GetList();
        }

        public AccountType GetDetails(int Id)
        {
            return _repository.GetDetails(Id);

        }

        public int Create(AccountType model)
        {
            return _repository.Save(model);
        }

        public void Update(AccountType model)
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
                        Text = item.Name,
                        Value = item.Id.ToString(),
                    };
                    accountTypeSelectList.Add(selectItem);
                } 
            }

            return accountTypeSelectList;
        }
       
    }
}