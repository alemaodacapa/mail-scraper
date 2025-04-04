from flask import Flask, request, render_template, send_file
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time
import csv
import os

app = Flask(__name__)

# Função para realizar o scraping
def scrape_google_maps(keyword):
    # Configurar o navegador (certifique-se de ter o ChromeDriver instalado)
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # Executa o navegador em modo headless
    driver = webdriver.Chrome(options=options)

    try:
        # Acessar o Google Maps
        driver.get("https://www.google.com/maps")
        time.sleep(3)

        # Inserir a palavra-chave e localização
        search_box = driver.find_element(By.ID, "searchboxinput")
        search_box.send_keys(f"{keyword} no Brasil")
        search_box.send_keys(Keys.RETURN)
        time.sleep(5)

        # Rolar a página para carregar mais resultados
        for _ in range(10):  # Rola 10 vezes para carregar mais resultados
            driver.execute_script("document.querySelector('div[role=\"feed\"]').scrollBy(0, 2000)")
            time.sleep(2)

        # Extrair os resultados
        results = []
        listings = driver.find_elements(By.CSS_SELECTOR, "div[role='article']")
        for listing in listings[:5000]:  # Limitar a 5000 resultados
            try:
                name = listing.find_element(By.CSS_SELECTOR, "div.fontHeadlineSmall").text
                address = listing.find_element(By.CSS_SELECTOR, "div.Io6YTe").text
                phone = listing.find_element(By.CSS_SELECTOR, "div.WGy98").text if listing.find_elements(By.CSS_SELECTOR, "div.WGy98") else "N/A"
                website = listing.find_element(By.CSS_SELECTOR, "a[data-value]").get_attribute("href") if listing.find_elements(By.CSS_SELECTOR, "a[data-value]") else "N/A"
                email = extract_email_from_website(website) if website != "N/A" else "N/A"
                results.append({
                    "Nome": name,
                    "Endereço": address,
                    "Telefone": phone,
                    "Website": website,
                    "Email": email
                })
            except Exception as e:
                print(f"Erro ao extrair dados: {e}")
                continue

        driver.quit()
        return results

    except Exception as e:
        print(f"Erro durante o scraping: {e}")
        driver.quit()
        return []

# Função para extrair e-mails de websites
def extract_email_from_website(url):
    import requests
    from bs4 import BeautifulSoup
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        text = soup.get_text()
        import re
        emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
        return emails[0] if emails else "N/A"
    except:
        return "N/A"

# Rota principal
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        keyword = request.form["keyword"]
        results = scrape_google_maps(keyword)

        # Salvar os resultados em um arquivo CSV
        filename = "results.csv"
        with open(filename, mode="w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=["Nome", "Endereço", "Telefone", "Website", "Email"])
            writer.writeheader()
            writer.writerows(results)

        return send_file(filename, as_attachment=True)

    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
    from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
