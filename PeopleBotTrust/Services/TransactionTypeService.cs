using EFPeopleBotTrust;
using EFPeopleBotTrust.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

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

        public List<SelectListItem> GetSelectList()
        {

            var list = GetList();

            var transactionTypeSelectList = new List<SelectListItem>();

            if (list != null)
            {
                foreach (var item in list)
                {
                    var selectItem = new SelectListItem
                    {
                        Text = item.Name,
                        Value = item.Id.ToString(),
                    };
                    transactionTypeSelectList.Add(selectItem);
                }
            }

            return transactionTypeSelectList;
        }

    }
}