Group Members:
Ibrashov Anuar
Ibrayev Miras
Jumagali Elgeldi

Project: FightTrack

FightTrack is a platform for amateur athletes to track their training sessions and arrange sparring matches. The system helps users keep a personal training diary and connect with other athletes for sparring at specific gyms or locations.

Models:
- User (built-in Django model)
- Gym (gym/location)
- TrainingLog (training entry with focus on striking, grappling, or physical conditioning)
- SparringRequest (sparring challenge/request)

Relationships:
- TrainingLog references User to indicate who completed the training
- SparringRequest references User as the initiator
- SparringRequest references User as the opponent
- SparringRequest references Gym as the location where the sparring will take place

