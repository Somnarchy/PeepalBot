using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeopleBotTrust.Repository
{
    public class CustomerDocumentRepository
    {
        private readonly peepalbot_dbEntities _context;
        public CustomerDocumentRepository()
        {
            _context = new peepalbot_dbEntities();

        }

        public List<CustomerDocument> GetList()
        {
            return _context.CustomerDocuments.ToList();
        }

        public CustomerDocument GetDetails(int id)
        {

            return _context.CustomerDocuments.FirstOrDefault(x => x.Id == id);
        }

        public int Save(CustomerDocument model)
        {
            _context.CustomerDocuments.Add(model);
             _context.SaveChanges();
            return model.Id;
        }

        public void Update(CustomerDocument model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
            //_context.CustomerDocuments.Attach(model);
            //_context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.CustomerDocuments.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}
