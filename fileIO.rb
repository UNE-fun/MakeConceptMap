#!/usr/bin/ruby
# -*- coding: utf-8 -*-

require "cgi"

cgi = CGI.new()

print "Content-type: text/html\n\n"

if (false)
  print cgi["cmd"]+"<BR/>\n"
  print cgi["params"]+"<BR/>\n"
  print cgi["fn"]+"<BR/>\n"
end

if (cgi['cmd'] == 'read')
  fh = open('data/'+cgi['fn'], "r")
  print fh.read
  fh.close
elsif (cgi['cmd'] == 'savelog')
  fh = open('data/'+cgi['fn'], "w")
  fh.printf(cgi['params'])
  fh.close
elsif (cgi['cmd'] == 'save')
  fh = open('data/'+cgi['fn'], "w")
  fh.printf(cgi['params'])
  fh.close
end
