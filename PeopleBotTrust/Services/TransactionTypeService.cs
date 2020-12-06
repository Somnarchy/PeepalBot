using EFPeopleBotTrust;
using EFPeopleBotTrust.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Services
{
    public class TransactionTypeService
    {
        private TransactionTypeRepository _repository { get; set; }

        public TransactionTypeService()
        {
            _repository = new TransactionTypeRepository();

        }
        public List<TransactionType> GetList()
        {
            return _repository.GetList();
        }

        public TransactionType GetDetails(int Id)
        {
            return _repository.GetDetails(Id);

        }

        public int Create(TransactionType model)
        {
            return _repository.Save(model);
        }

        public void Update(TransactionType model)
        {

            _repository.Update(model);
        }

        public void Delete(int id)
        {
            _repository.Delete(id);
        }
    }
}