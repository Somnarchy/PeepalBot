using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using EFPeopleBotTrust;
using EFPeopleBotTrust.Repository;
using PeopleBotTrust.Models;

namespace PeopleBotTrust.Services
{
    public class AccountService
    {
        private List<AccountViewModel> AccountList { get; set; }
        private AccountRepository _repository { get; set; }
        public AccountService()
        {
            _repository = new AccountRepository();

        }
        public List<Account> GetList()
        {
            var list = new List<AccountViewModel>();
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
    }
}
