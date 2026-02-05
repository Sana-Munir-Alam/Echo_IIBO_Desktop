#include <iostream>
#include <fstream>
#include <string>
#include <vector>

using namespace std;

static const string base64_chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

bool is_base64(unsigned char c) {
    return (isalnum(c) || c == '+' || c == '/');
}

string base64_decode(const string& encoded_string) {
    int in_len = encoded_string.size();
    int i = 0, in_ = 0;
    unsigned char char_array_4[4], char_array_3[3];
    string decoded_string;

    while (in_len-- && encoded_string[in_] != '=' && is_base64(encoded_string[in_])) {
        char_array_4[i++] = encoded_string[in_++];
        if (i == 4) {
            for (i = 0; i < 4; i++)
                char_array_4[i] = base64_chars.find(char_array_4[i]);

            char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
            char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
            char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

            for (i = 0; i < 3; i++)
                decoded_string += char_array_3[i];

            i = 0;
        }
    }

    if (i) {
        for (int j = i; j < 4; j++)
            char_array_4[j] = 0;

        for (int j = 0; j < 4; j++)
            char_array_4[j] = base64_chars.find(char_array_4[j]);

        char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
        char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
        char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

        for (int j = 0; j < i - 1; j++)
            decoded_string += char_array_3[j];
    }

    return decoded_string;
}

int main() {
    string base64_encoded;
    cout << "Enter the secret text: ";
    getline(cin, base64_encoded);

    string decoded_message = base64_decode(base64_encoded);

    string file_path = "ANSWER.txt";
    ofstream file(file_path);
    file << decoded_message;
    file.close();

    cout << "Decoded message saved to " << file_path << endl;

    return 0;
}