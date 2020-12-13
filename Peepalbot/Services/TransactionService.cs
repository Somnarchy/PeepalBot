using EFPeepalbot;
using EFPeepalbot.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Peepalbot.Services
{
    public class TransactionService
    {
        private TransactionRepository _repository { get; set; }

        public TransactionService()
        {
            _repository = new TransactionRepository();
        }
        public List<Transaction> GetList()
        {
            return _repository.GetList();
        }

        public Transaction GetDetails(int Id)
        {
            return _repository.GetDetails(Id);

        }

        public int Create(Transaction model)
        {
            model.CreatedBy = 123;
            model.CreatedDate = DateTime.Now;
            model.Status = true;
            return _repository.Save(model);
        }

        public void Update(Transaction model)
        {
            model.ModifiedBy = 123;
            model.ModifiedDate = DateTime.Now;
            _repository.Update(model);
        }

        public void Delete(int id)
        {
            _repository.Delete(id);
        }
    }
}