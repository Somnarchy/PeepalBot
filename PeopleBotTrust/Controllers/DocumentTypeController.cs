using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using EFPeopleBotTrust;
using PeopleBotTrust.Services;

using PeopleBotTrust.Helpers;
using PeopleBotTrust;

namespace PeopleBotTrust.Controllers
{
    public class DocumentTypeController : Controller
    {
        // declare DocumentType
        private DocumentTypeService _service = new DocumentTypeService();

        // GET:DocumentType
        public ActionResult Index()
        {
            var model = _service.GetList();
            return View(model);
        }

        //GET: DocumentType/Details/5
        public ActionResult Details(int id)
        {
            var model = _service.GetDetails(id);

            if (model == null)
            {
                return HttpNotFound();
            }
            if (Request.IsAjaxRequest())
            {
                //return PartialView("_details",model);
                ResponseMessage responseMessage = new ResponseMessage(MessageType.Info)
                {
                    Status = true,
                    Message = "",
                    Data = model,
                    Title = "Fetch Detail",
                };
                return Json(responseMessage, JsonRequestBehavior.AllowGet);
            }
            else
            {
                return View(model);
            }
        }

        // GET: DocumentType /Create
        public ActionResult Create()
        {
            //var model = new DocumentType();
            return View();
        }

        // POST: DocumentType/Create

        [HttpPost]
        public ActionResult Create(DocumentType documentType)
        {
            if (ModelState.IsValid)
            {
                _service.Create(documentType);
                return RedirectToAction("Index");
            }

            return View(documentType);
        }

        // GET: DocumentType/Edit/5
        public ActionResult Edit(int id)
        {
            var documentType = _service.GetDetails(id);

            if (documentType == null)
            {
               return HttpNotFound();
            }
            return View(documentType);
        }

        // POST: DocumentType/Edit/5
        [HttpPost]
        ///*public ActionResult Edit(int id, FormCollection collection*/)
        public ActionResult Edit(DocumentType documentType)
        {
                if (ModelState.IsValid)
                {
                
                    _service.Update(documentType);
                    return RedirectToAction("Index");
                }
                return View(documentType);


                //try
                //{
                //    var documentType = new DocumentType();
                 
                //    documentType.Name = collection["Name"];
                //    _service.Update();

                //    return RedirectToAction("Index");
                //}
                //catch
                //{
                //    return View();
                //}

        }

        // GET: DocumentType/Delete/5
        public ActionResult Delete(int id)
        {
            var documentType = _service.GetDetails(id);
            if (documentType == null)
            {
                return HttpNotFound();
            }
            return View(documentType);
        }

        // POST: DocumentType/Delete/5
        [HttpPost]
        public JsonResult Delete(int id, FormCollection collection)
        {
            ResponseMessage responseMessage = null;
            try
            {
                _service.Delete(id);

                responseMessage = new ResponseMessage(MessageType.Success)
                {
                    Status = true,
                    Message = "Record successfully deleted.",
                    Title = "Delete record.",
                };
            }
            catch (Exception e)
            {
                responseMessage = new ResponseMessage(MessageType.Failure)
                {
                    Status = false,
                    Message = e.Message,
                    Title = "Error Deleting record."

                };
            }
            return Json(responseMessage);
        }
    }
}

