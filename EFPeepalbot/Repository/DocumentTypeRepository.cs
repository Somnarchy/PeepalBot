using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeepalbot.Repository
{
    public class DocumentTypeRepository
    {
        private readonly PeepalbotEntities _context;
        public DocumentTypeRepository()
        {
            _context = new PeepalbotEntities();
        }

        public List<DocumentType> GetList()
        {
            return _context.DocumentTypes.ToList();
        }

        public DocumentType GetDetails(int id)
        {

            return _context.DocumentTypes.FirstOrDefault(x => x.Id == id);
        }

        public int Save(DocumentType model)
        {
            _context.DocumentTypes.Add(model);
            var insertedId = _context.SaveChanges();
            return insertedId;
        }

        public void Update(DocumentType model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
            //_context.DocumentTypes.Attach(model);
            //_context.SaveChanges();
        }

        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.DocumentTypes.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}
