using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using EFPeepalbot;
using EFPeepalbot.Repository;
using Peepalbot.Models;


namespace Peepalbot.Services
{
    public class AccountService
    {
        private List<AccountModel> AccountList { get; set; }
        private AccountRepository _repository { get; set; }
        public AccountService()
        {
            _repository = new AccountRepository();

        }
        public List<Account> GetList()
        {
          
            return _repository.GetList();           
        }
        public Account GetDetails(int Id)
        {
            return _repository.GetDetails(Id);
        }
        public int Create(Account model)
        {
            model.CreatedBy = 1;// should come from session logged Id
            model.CreatedDate = DateTime.Now;
            return _repository.Save(model);
        }
        public void Update(Account model)
        {
            _repository.Update(model);
        }
        public void Delete(int id)
        {
            _repository.Delete(id);
        }


        public List<SelectListItem> GetSelectList()
        {
            var accountList = GetList();

            var accountSelectList = new List<SelectListItem>();

            if (accountList != null)
            {
                foreach (var item in accountList)
                {
                    var selectItem = new SelectListItem
                    {
                        Text = $"{item.Name}",
                        Value = item.Id.ToString(),
                    };
                    accountSelectList.Add(selectItem);
                }

            }
            return accountSelectList;
        }
    }
}
