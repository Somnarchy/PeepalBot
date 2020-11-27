using EFPeopleBotTrust;
using EFPeopleBotTrust.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Services
{
    public class PositionService
    {
        private PositionRepository _repository { get; set; }

        public PositionService()
        {
            _repository = new PositionRepository();

        }
        public List<Position> GetList()
        {
            return _repository.GetList();
        }

        public Position GetDetails(int Id)
        {
            return _repository.GetDetails(Id);

        }

        public int Create(Position model)
        {
            return _repository.Save(model);
        }

        public void Update(Position model)
        {

            _repository.Update(model);
        }

        public void Delete(int id)
        {
            _repository.Delete(id);
        }
    }

}