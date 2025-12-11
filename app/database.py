class InMemoryDB:
    def __init__(self):
        self.reset()

    def reset(self):
        self.organizations = {}
        self.workshops = {}
        self.domains = {}
        self.roles = {}
        self.activities = {}
        self.recommended_raci = {}
        self.workshop_raci = {}
        self.issues = {}
        self.actions = {}
        self._id_counter = 1

    def _next_id(self):
        ident = self._id_counter
        self._id_counter += 1
        return ident


db_instance = InMemoryDB()
