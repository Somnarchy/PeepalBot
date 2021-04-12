using EFPeepalbot;
using EFPeepalbot.Repository;
using PeepalBotApi.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace PeepalBotApi.Services
{
   
    public class DocumentTypeService
    {       
        private DocumentTypeRepository _repository { get; set; }

        public DocumentTypeService()
        {
            _repository = new DocumentTypeRepository();

        }
        public List<DocumentType> GetList()
        {
            return _repository.GetList();
        }

        public DocumentType GetDetails(int Id)
        {
            return _repository.GetDetails(Id);
        }

        public int Create(DocumentType model)
        {
            return _repository.Save(model);
        }

        public void Update(DocumentType model)
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

            var selectList = new List<SelectListItem>();

            if (list != null)
            {
                foreach (var item in list)
                {
                    var selectItem = new SelectListItem
                    {
                        Text = item.Name,
                        Value = item.Id.ToString(),
                    };
                    selectList.Add(selectItem);
                } 
            }

            return selectList;
        }
       
    }
}