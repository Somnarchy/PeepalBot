using EFPeepalbot;
using EFPeepalbot.Repository;
using Peepalbot.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Peepalbot.Services
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
            var list = new List<DocumentType>();
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

            var DocumentTypeSelectList = new List<SelectListItem>();

            if (list != null)
            {
                foreach (var item in list)
                {
                    var selectItem = new SelectListItem
                    {
                        Text = item.Name,
                        Value = item.Id.ToString(),
                    };
                    DocumentTypeSelectList.Add(selectItem);
                }
            }

            return DocumentTypeSelectList;
        }

    }
}