from flask import Flask, render_template, send_from_directory
app = Flask(__name__, static_url_path="")

@app.route("/")
def hello():
    return render_template('index.html', my_string="Wheeeee!", my_list=[0,1,2,3,4,5])

@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory('static', path)


if __name__ == "__main__":
    app.run()
