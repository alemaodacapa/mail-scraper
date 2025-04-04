<?php
// scraper.php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $url = $_POST['url'];

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        echo json_encode(['error' => 'URL inválida']);
        exit;
    }

    // Faz a requisição HTTP para o site
    $html = @file_get_contents($url);

    if (!$html) {
        echo json_encode(['error' => 'Não foi possível acessar o site']);
        exit;
    }

    // Regex para encontrar e-mails
    preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $html, $matches);

    $emails = array_unique($matches[0]);

    echo json_encode(['emails' => $emails]);
} else {
    echo json_encode(['error' => 'Método inválido']);
}
?>
