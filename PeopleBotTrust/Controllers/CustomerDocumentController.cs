using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using EFPeopleBotTrust;
using PeopleBotTrust.Helpers;
using PeopleBotTrust.Models;
using PeopleBotTrust.Services;


namespace PeopleBotTrust.Controllers
{
    public class CustomerDocumentController : Controller
    {
        readonly CustomerDocumentService _service;
        public CustomerDocumentController()
        {
            _service = new CustomerDocumentService();
        }

        // GET: CustomerDocument
        public ActionResult Index()
        {
            var model = new CustomerDocumentModel();
            model.CustomerDocumentList = _service.GetList();
            return View(model);
        }

        // GET: CustomerDocument/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }

            var customerDocument = _service.GetDetails((int)id);

            if (customerDocument == null)
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
                    Data = customerDocument,
                    Title = "Fetch Detail",
                };
                return Json(responseMessage, JsonRequestBehavior.AllowGet);
            }
            return View(customerDocument);
        }

        // GET: CustomerDocument/Create
        public ActionResult Create()
        {
            var model = new CustomerDocumentModel();
            var DocumentTypeService = new DocumentTypeService();
            model.DocumentTypeSelectList = DocumentTypeService.GetSelectList();
            var CustomerService = new CustomerService();
            model.CustomerSelectList = CustomerService.GetSelectList();
            return View(model);
        }

        //    POST: CustomerDocument/Create
        //    To protect from overposting attacks, enable the specific properties you want to bind to, for 
        //     more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create(CustomerDocumentModel model, HttpPostedFileBase[] DocumentContent, FormCollection collection)
        {
            try
            {
                foreach(HttpPostedFileBase file in DocumentContent)
                {

                    //file save              
                    var folderName = Constants.GetCustomerDocumentFolder(model.CustomerDocument.CustomerId, true);
                    var fileName = FileService.SaveFile(file, folderName);
                    //before update
                    model.CustomerDocument.DocumentContent = fileName;

                    _service.Create(model.CustomerDocument);
                }

                return RedirectToAction("Index");
            }
            catch (Exception e)
            {
                return View();
            }

        }

        //GET: CustomerDocument/Edit/5
        public ActionResult Edit(int id)
        {
            #region DocumentTypeService
            var DocumentTypeService = new DocumentTypeService();

            #region CustomerService
            var CustomerService = new CustomerService();

            #endregion

            var model = new CustomerDocumentModel()
            {
                CustomerDocument = _service.GetDetails(id),
                CustomerSelectList = CustomerService.GetSelectList(),
                DocumentTypeSelectList = DocumentTypeService.GetSelectList(),
            };

            return View(model);

        }

        //POST: CustomerDocument/Edit/5
        //     To protect from overposting attacks, enable the specific properties you want to bind to, for 
        //     more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(CustomerDocumentModel model, HttpPostedFileBase[] documentContent, FormCollection collection)
        {
            try
            {
                var oldCustomerDocument = _service.GetDetails(model.CustomerDocument.Id);
                oldCustomerDocument.CustomerId = model.CustomerDocument.CustomerId;
                oldCustomerDocument.DocumentTypeId = model.CustomerDocument.DocumentTypeId;
                var _oldDocumentContent = oldCustomerDocument.DocumentContent;

                foreach (HttpPostedFileBase file in documentContent)
                {
                    //file save 
                    if (file != null && file.ContentLength > 0)
                    {
                        string fileName = Path.GetFileName(file.FileName);
                        string folderPath = Helpers.Constants.GetCustomerDocumentFolder(oldCustomerDocument.Id);

                        //string path = Path.Combine(folderPath, fileName);
                        var path = FileService.GetFullPath(folderPath, fileName);
                        file.SaveAs(path);

                        //Delete the old fileName
                        string fullPath = Path.Combine(folderPath + _oldDocumentContent);
                        FileService.DeleteFile(fullPath);
                    }
                }
                _service.Update(oldCustomerDocument);

                return RedirectToAction("Index");
            }
            catch (Exception e)
            {
                return View();
            }
        }

        //GET: CustomerDocument/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            var customerDocument = _service.GetDetails((int)id);
            if (customerDocument == null)
            {
                return HttpNotFound();
            }
            return View(customerDocument);
        }


        // POST: CostumerDocument/Delete/5

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
#endregion