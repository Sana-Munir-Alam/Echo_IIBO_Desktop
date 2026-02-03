#include <iostream>
#include <cstring>

using namespace std;

const int TABLE_SIZE = 10007; // A prime number for better distribution

struct HashNode {
    char* post;
    HashNode* next;
    
    HashNode(const char* text) {
        post = new char[strlen(text) + 1];
        strcpy(post, text);
        next = nullptr;
    }
    
    ~HashNode() {
        delete[] post;
    }
};

class PostHashTable {
private:
    HashNode** table;
    
    // Simple hash function using polynomial rolling hash
    unsigned int hashFunction(const char* str) {
        unsigned int hash = 0;
        unsigned int prime = 31;
        
        for (int i = 0; str[i] != '\0'; i++) {
            hash = (hash * prime + str[i]) % TABLE_SIZE;
        }
        return hash;
    }

public:
    PostHashTable() {
        table = new HashNode*[TABLE_SIZE];
        for (int i = 0; i < TABLE_SIZE; i++) {
            table[i] = nullptr;
        }
    }
    
    ~PostHashTable() {
        for (int i = 0; i < TABLE_SIZE; i++) {
            HashNode* current = table[i];
            while (current != nullptr) {
                HashNode* temp = current;
                current = current->next;
                delete temp;
            }
        }
        delete[] table;
    }
    
    bool insert(const char* post) {
        unsigned int index = hashFunction(post);
        // Check if post already exists
        HashNode* current = table[index];
        while (current != nullptr) {
            if (strcmp(current->post, post) == 0) {
                return false; // Duplicate found
            }
            current = current->next;
        }
        
        // Insert new post at beginning of chain if no duplicate found
        HashNode* newNode = new HashNode(post);
        newNode->next = table[index];
        table[index] = newNode;
        
        return true;
    }
};

int main() {
    PostHashTable postTable;
    char post[1000];
    
    cout << "Social Media Duplicate Detection System" << endl;
    cout << "Enter posts one per line (empty line to exit):" << endl;
    
    while (true) {
        cout << "> ";
        cin.getline(post, 1000);
        if (strlen(post) == 0) {
            break;
        }
        if (postTable.insert(post)) {
            cout << "NEW" << endl;
        } else {
            cout << "DUPLICATE" << endl;
        }
    }
    return 0;
}